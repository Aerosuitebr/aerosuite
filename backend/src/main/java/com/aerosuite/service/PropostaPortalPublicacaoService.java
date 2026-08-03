package com.aerosuite.service;

import com.aerosuite.domain.ClienteProposta;
import com.aerosuite.domain.FuncionalidadeExterna;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.UsuarioExterno;
import com.aerosuite.domain.UsuarioExternoFuncionalidade;
import com.aerosuite.dto.PropostaDisponibilizarPortalRequest;
import com.aerosuite.dto.PropostaDisponibilizarPortalResultDto;
import com.aerosuite.dto.PropostaPortalAcessoDto;
import com.aerosuite.dto.UsuarioExternoDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.ServerUrlUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.Locale;
import java.util.Set;

/**
 * Publicação da proposta no portal externo e concessão de acesso ao cliente.
 */
@ApplicationScoped
public class PropostaPortalPublicacaoService {

    private static final Set<String> STATUS_VISIVEIS = Set.of("ENVIADA", "APROVADA", "REJEITADA", "CANCELADA");
    private static final String STATUS_ENVIADA = "ENVIADA";
    private static final String CODIGO_FUNC_PROPOSTAS = "propostas-externa";

    @Inject
    PropostaComercialService propostaComercialService;

    @Inject
    UsuarioExternoService usuarioExternoService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    EmailService emailService;

    @Inject
    ServerUrlUtil serverUrlUtil;

    public PropostaPortalAcessoDto verificarAcesso(Long propostaId) {
        PropostaComercial proposta = requireProposta(propostaId);
        return montarDiagnostico(proposta);
    }

    @Transactional
    public PropostaDisponibilizarPortalResultDto disponibilizarPortal(
            Long propostaId,
            PropostaDisponibilizarPortalRequest request) {
        PropostaComercial proposta = requireProposta(propostaId);
        PropostaDisponibilizarPortalResultDto result = new PropostaDisponibilizarPortalResultDto();

        if (isBlank(proposta.clienteEmail)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_PORTAL_EMAIL_REQUIRED));
        }

        boolean jaVisivel = isVisivelNoPortal(proposta.status);
        result.jaEstavaVisivel = jaVisivel;

        result.vinculoClienteAtualizado = ensureClientePropostaVinculo(proposta);
        proposta.persist();

        if (!jaVisivel) {
            proposta.status = STATUS_ENVIADA;
            proposta.persist();
        }

        UsuarioExterno usuario = findUsuarioExterno(proposta);
        boolean criarAcesso = request == null || request.criarAcessoExterno == null || request.criarAcessoExterno;
        boolean notificar = request == null || request.notificarCliente == null || request.notificarCliente;

        if (usuario == null && criarAcesso) {
            String nome = resolveNomeContato(proposta, request);
            UsuarioExternoDto criado = usuarioExternoService.createFromProposta(
                    nome,
                    proposta.clienteEmail.trim(),
                    proposta.clienteNome,
                    proposta.clienteTelefone,
                    proposta.clientePropostaId,
                    internalUserContext.getUserId(),
                    notificar);
            result.usuarioExternoCriado = true;
            usuario = UsuarioExterno.findById(criado.id());
        } else if (usuario != null) {
            if (proposta.clientePropostaId != null && usuario.clientePropostaId == null) {
                usuario.clientePropostaId = proposta.clientePropostaId;
                usuario.persist();
                result.vinculoClienteAtualizado = true;
            }
            if (!Boolean.TRUE.equals(usuario.ativo)) {
                usuarioExternoService.activate(usuario.id);
                usuario = UsuarioExterno.findById(usuario.id);
            }
            result.funcionalidadePropostasConcedida = ensureFuncionalidadePropostas(usuario.id);
        } else {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_PORTAL_NO_EXTERNAL_USER));
        }

        if (notificar && usuario != null) {
            result.emailNotificacaoEnviado = enviarNotificacaoPortal(proposta, usuario);
        }

        result.proposta = propostaComercialService.findById(proposta.id);
        result.acesso = montarDiagnostico(proposta);
        return result;
    }

    private PropostaPortalAcessoDto montarDiagnostico(PropostaComercial proposta) {
        PropostaPortalAcessoDto dto = new PropostaPortalAcessoDto();
        dto.propostaSalva = proposta.id != null;
        dto.temEmailCliente = !isBlank(proposta.clienteEmail);
        dto.clientePropostaId = proposta.clientePropostaId;
        dto.statusAtual = proposta.status;
        dto.visivelNoPortal = isVisivelNoPortal(proposta.status);

        UsuarioExterno usuario = findUsuarioExterno(proposta);
        if (usuario != null) {
            dto.usuarioExternoExiste = true;
            dto.usuarioExternoAtivo = Boolean.TRUE.equals(usuario.ativo);
            dto.usuarioExternoId = usuario.id;
            dto.usuarioExternoEmail = usuario.email;
            dto.usuarioExternoNome = usuario.nome;
            dto.temAcessoPropostas = hasFuncionalidadePropostas(usuario.id);
        }

        dto.podeDisponibilizar = dto.propostaSalva
                && dto.temEmailCliente
                && !isBlank(proposta.clienteNome);

        if (!dto.temEmailCliente) {
            dto.mensagemBloqueio = ApiI18nMessages.domain("comercial.proposta.portal.noEmail");
        } else if (isBlank(proposta.clienteNome)) {
            dto.mensagemBloqueio = ApiI18nMessages.domain("comercial.proposta.portal.noName");
        } else if (!dto.propostaSalva) {
            dto.mensagemBloqueio = ApiI18nMessages.domain("comercial.proposta.portal.saveFirst");
        }

        return dto;
    }

    private boolean ensureClientePropostaVinculo(PropostaComercial proposta) {
        if (proposta.clientePropostaId != null) {
            syncClientePropostaFromProposta(proposta.clientePropostaId, proposta);
            return false;
        }

        ClienteProposta existente = findClientePropostaExistente(proposta);
        if (existente != null) {
            proposta.clientePropostaId = existente.id;
            syncClientePropostaFromProposta(existente.id, proposta);
            return true;
        }

        ClienteProposta novo = new ClienteProposta();
        novo.nome = proposta.clienteNome.trim();
        novo.email = trimToNull(proposta.clienteEmail);
        novo.cnpjCpf = trimToNull(proposta.clienteCnpjCpf);
        novo.telefone = trimToNull(proposta.clienteTelefone);
        novo.contato = trimToNull(proposta.clienteContato);
        novo.endereco = trimToNull(proposta.clienteEndereco);
        novo.cidade = trimToNull(proposta.clienteCidade);
        novo.estado = trimToNull(proposta.clienteEstado);
        novo.cep = trimToNull(proposta.clienteCep);
        novo.observacao = trimToNull(proposta.clienteObservacao);
        novo.isActive = true;
        novo.createdBy = internalUserContext.getUserId();
        novo.persist();
        proposta.clientePropostaId = novo.id;
        return true;
    }

    private ClienteProposta findClientePropostaExistente(PropostaComercial proposta) {
        if (!isBlank(proposta.clienteCnpjCpf)) {
            ClienteProposta byDoc = ClienteProposta
                    .find("cnpjCpf = ?1 and isActive = true", proposta.clienteCnpjCpf.trim())
                    .firstResult();
            if (byDoc != null) {
                return byDoc;
            }
        }
        if (!isBlank(proposta.clienteEmail)) {
            String email = proposta.clienteEmail.trim().toLowerCase(Locale.ROOT);
            return ClienteProposta.find("lower(email) = ?1 and isActive = true", email).firstResult();
        }
        return null;
    }

    private void syncClientePropostaFromProposta(Integer clientePropostaId, PropostaComercial proposta) {
        ClienteProposta cp = ClienteProposta.findById(clientePropostaId);
        if (cp == null) {
            return;
        }
        if (isBlank(cp.email) && !isBlank(proposta.clienteEmail)) {
            cp.email = proposta.clienteEmail.trim().toLowerCase(Locale.ROOT);
        }
        if (isBlank(cp.nome) && !isBlank(proposta.clienteNome)) {
            cp.nome = proposta.clienteNome.trim();
        }
        cp.persist();
    }

    private UsuarioExterno findUsuarioExterno(PropostaComercial proposta) {
        if (!isBlank(proposta.clienteEmail)) {
            UsuarioExterno byEmail = usuarioExternoService.findByEmailInTenant(proposta.clienteEmail);
            if (byEmail != null) {
                return byEmail;
            }
        }
        if (proposta.clientePropostaId != null) {
            return UsuarioExterno.find(
                    "clientePropostaId = ?1 and orgTenantId = ?2",
                    proposta.clientePropostaId,
                    tenantDataAccess.currentTenantId()).firstResult();
        }
        return null;
    }

    private boolean ensureFuncionalidadePropostas(Integer usuarioExternoId) {
        FuncionalidadeExterna func = FuncionalidadeExterna.findByCodigo(CODIGO_FUNC_PROPOSTAS);
        if (func == null) {
            return false;
        }
        if (UsuarioExternoFuncionalidade.existsAssociacao(usuarioExternoId, func.id)) {
            return false;
        }
        usuarioExternoService.concederFuncionalidade(
                usuarioExternoId, func.id, internalUserContext.getUserId());
        return true;
    }

    private boolean hasFuncionalidadePropostas(Integer usuarioExternoId) {
        FuncionalidadeExterna func = FuncionalidadeExterna.findByCodigo(CODIGO_FUNC_PROPOSTAS);
        if (func == null) {
            return false;
        }
        return UsuarioExternoFuncionalidade.existsAssociacao(usuarioExternoId, func.id);
    }

    private static String resolveNomeContato(PropostaComercial proposta, PropostaDisponibilizarPortalRequest request) {
        if (request != null && !isBlank(request.nomeContato)) {
            return request.nomeContato.trim();
        }
        if (!isBlank(proposta.clienteContato)) {
            return proposta.clienteContato.trim();
        }
        return proposta.clienteNome.trim();
    }

    private boolean enviarNotificacaoPortal(PropostaComercial proposta, UsuarioExterno usuario) {
        if (isBlank(proposta.clienteEmail)) {
            return false;
        }
        String base = serverUrlUtil.getFrontendUrl();
        String loginUrl = base + "/externo/login";
        String propostasUrl = base + "/externo/propostas";
        String nome = !isBlank(usuario.nome) ? usuario.nome : proposta.clienteNome;
        String locale = resolveClienteEmailLocale(proposta);
        return emailService.sendPropostaDisponivelPortalEmail(
                proposta.clienteEmail.trim(),
                nome,
                proposta.numeroProposta,
                loginUrl,
                propostasUrl,
                locale);
    }

    private String resolveClienteEmailLocale(PropostaComercial proposta) {
        if (proposta.clientePropostaId != null) {
            ClienteProposta cliente = ClienteProposta.findById(proposta.clientePropostaId);
            if (cliente != null) {
                return com.aerosuite.i18n.UserLocaleResolver.resolve(cliente);
            }
        }
        return com.aerosuite.i18n.UserLocaleResolver.normalize(null);
    }

    private PropostaComercial requireProposta(Long id) {
        PropostaComercial entity = PropostaComercial.findById(id);
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_PORTAL_NOT_FOUND));
        }
        if (!tenantDataAccess.matchesTenant(entity.tenantId)) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_PORTAL_NOT_FOUND));
        }
        return entity;
    }

    private static boolean isVisivelNoPortal(String status) {
        return status != null && STATUS_VISIVEIS.contains(status.toUpperCase(Locale.ROOT));
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private static String trimToNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
