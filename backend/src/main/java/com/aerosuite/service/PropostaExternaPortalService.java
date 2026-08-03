package com.aerosuite.service;

import com.aerosuite.domain.ClienteProposta;
import com.aerosuite.domain.LogAcessoExterno;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.UsuarioExterno;
import com.aerosuite.dto.PropostaExternaDecisaoRequest;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.PropostaExternaDto;
import com.aerosuite.util.PanacheMaps;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * P4.2 — propostas visíveis e decisão (aprovar/rejeitar) no portal do cliente.
 */
@ApplicationScoped
public class PropostaExternaPortalService {

    private static final Set<String> STATUS_VISIVEIS = Set.of("ENVIADA", "APROVADA", "REJEITADA", "CANCELADA");
    private static final String STATUS_ENVIADA = "ENVIADA";
    private static final String STATUS_APROVADA = "APROVADA";
    private static final String STATUS_REJEITADA = "REJEITADA";

    @Inject
    PropostaComercialService propostaComercialService;

    @Inject
    PropostaPortalV11Service propostaPortalV11Service;

    @Inject
    PropostaComercialOsBridgeService propostaOsBridgeService;

    public List<PropostaExternaDto> listarParaUsuario(Integer usuarioExternoId) {
        UsuarioExterno usuario = requireUsuario(usuarioExternoId);
        String tenantId = TenantConstants.tenantIdOf(usuario.orgTenantId);

        List<PropostaComercial> todas = PropostaComercial.list(
                "tenantId = ?1 and status in ('ENVIADA','APROVADA','REJEITADA','CANCELADA') "
                        + "order by dataProposta desc, id desc",
                tenantId);

        List<PropostaComercial> acessiveis = new ArrayList<>();
        for (PropostaComercial p : todas) {
            if (podeAcessar(usuario, p)) {
                acessiveis.add(p);
            }
        }
        Set<Long> osIds = acessiveis.stream()
                .map(p -> p.osId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Long, OS> oss = osIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<OS, Long>byId(OS.list("id in ?1", osIds), o -> o.id);
        List<PropostaExternaDto> out = new ArrayList<>();
        for (PropostaComercial p : acessiveis) {
            out.add(toResumo(p, usuario, oss));
        }
        return out;
    }

    public PropostaExternaDto detalhe(Integer usuarioExternoId, Long propostaId) {
        UsuarioExterno usuario = requireUsuario(usuarioExternoId);
        PropostaComercial proposta = requirePropostaAcessivel(usuario, propostaId);
        return toDetalhe(proposta, usuario);
    }

    public String htmlImpressao(Integer usuarioExternoId, Long propostaId) {
        UsuarioExterno usuario = requireUsuario(usuarioExternoId);
        requirePropostaAcessivel(usuario, propostaId);
        return propostaComercialService.gerarHtmlImpressao(propostaId);
    }

    @Transactional
    public PropostaExternaDto aprovar(Integer usuarioExternoId, Long propostaId,
            PropostaExternaDecisaoRequest body, String ip, String userAgent) {
        return decidir(usuarioExternoId, propostaId, true, body, ip, userAgent);
    }

    @Transactional
    public PropostaExternaDto rejeitar(Integer usuarioExternoId, Long propostaId,
            PropostaExternaDecisaoRequest body, String ip, String userAgent) {
        return decidir(usuarioExternoId, propostaId, false, body, ip, userAgent);
    }

    private PropostaExternaDto decidir(Integer usuarioExternoId, Long propostaId, boolean aprovar,
            PropostaExternaDecisaoRequest body, String ip, String userAgent) {
        UsuarioExterno usuario = requireUsuario(usuarioExternoId);
        PropostaComercial proposta = requirePropostaAcessivel(usuario, propostaId);

        if (!STATUS_ENVIADA.equalsIgnoreCase(nullToEmpty(proposta.status))) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_EXTERNA_STATUS_INVALID));
        }

        String motivo = body != null && body.motivo != null ? body.motivo.trim() : "";
        if (!aprovar && motivo.isEmpty()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_EXTERNA_REJECTION_REASON));
        }

        proposta.status = aprovar ? STATUS_APROVADA : STATUS_REJEITADA;
        proposta.clienteDecisaoEm = LocalDateTime.now();
        proposta.clienteDecisaoIp = trimToNull(ip);
        proposta.clienteDecisaoUserAgent = trimToNull(truncate(userAgent, 500));
        proposta.clienteDecisaoMotivo = motivo.isEmpty() ? null : motivo;
        proposta.clienteDecisaoUsuarioExternoId = usuario.id;
        proposta.persist();

        LogAcessoExterno.registrarAcesso(
                usuario,
                aprovar ? "PROPOSTA_APROVADA" : "PROPOSTA_REJEITADA",
                proposta.id,
                "PROPOSTA_COMERCIAL",
                ip,
                userAgent,
                motivo.isEmpty() ? null : motivo);

        if (aprovar && proposta.osId == null) {
            try {
                propostaOsBridgeService.gerarOs(propostaId);
                proposta = requirePropostaAcessivel(usuario, propostaId);
            } catch (Exception ex) {
                // Aprovação do cliente permanece válida; OS pode ser gerada manualmente pela oficina.
            }
        }

        return toDetalhe(proposta, usuario);
    }

    private PropostaComercial requirePropostaAcessivel(UsuarioExterno usuario, Long propostaId) {
        PropostaComercial proposta = PropostaComercial.findById(propostaId);
        if (proposta == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_EXTERNA_NOT_FOUND));
        }
        if (!podeAcessar(usuario, proposta)) {
            throw new ForbiddenException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.EXTERNO_PROPOSTA_DENIED));
        }
        return proposta;
    }

    static boolean podeAcessar(UsuarioExterno usuario, PropostaComercial proposta) {
        if (usuario == null || proposta == null) {
            return false;
        }
        String tenantId = TenantConstants.tenantIdOf(usuario.orgTenantId);
        if (proposta.tenantId == null || !proposta.tenantId.equals(tenantId)) {
            return false;
        }
        if (proposta.status == null || !STATUS_VISIVEIS.contains(proposta.status.toUpperCase(Locale.ROOT))) {
            return false;
        }
        if (proposta.clientePropostaId != null && usuario.clientePropostaId != null
                && proposta.clientePropostaId.equals(usuario.clientePropostaId)) {
            return true;
        }
        if (proposta.clientePropostaId != null && usuario.clientePropostaId == null) {
            ClienteProposta cp = ClienteProposta.findById(proposta.clientePropostaId);
            if (cp != null && emailsMatch(usuario.email, cp.email)) {
                return true;
            }
        }
        if (emailsMatch(usuario.email, proposta.clienteEmail)) {
            return true;
        }
        if (!isBlank(usuario.empresa) && !isBlank(proposta.clienteNome)) {
            return normalize(usuario.empresa).equals(normalize(proposta.clienteNome));
        }
        return false;
    }

    private static boolean emailsMatch(String a, String b) {
        if (isBlank(a) || isBlank(b)) {
            return false;
        }
        return normalize(a).equals(normalize(b));
    }

    private static String normalize(String s) {
        return s.trim().toLowerCase(Locale.ROOT);
    }

    private PropostaExternaDto toResumo(PropostaComercial p, UsuarioExterno usuario) {
        return toResumo(p, usuario, null);
    }

    private PropostaExternaDto toResumo(PropostaComercial p, UsuarioExterno usuario, Map<Long, OS> oss) {
        PropostaExternaDto dto = new PropostaExternaDto();
        dto.id = p.id;
        dto.numeroProposta = p.numeroProposta;
        dto.status = p.status;
        dto.dataProposta = p.dataProposta;
        dto.validadeProposta = p.validadeProposta;
        dto.produtoNome = p.produtoNome;
        dto.produtoPn = p.produtoPn;
        dto.valorTotalFinal = p.valorTotalFinal;
        dto.totalGeralUsd = p.totalGeralUsd;
        dto.osId = p.osId;
        dto.osVinculo = buildOsVinculo(p.osId, oss);
        fillDecisaoFlags(dto, p, usuario);
        return dto;
    }

    private PropostaExternaDto toDetalhe(PropostaComercial p, UsuarioExterno usuario) {
        PropostaExternaDto dto = toResumo(p, usuario);
        dto.servicoExecutado = p.servicoExecutado;
        dto.prazoEntrega = p.prazoEntrega;
        dto.formaPagamento = p.formaPagamento;
        dto.observacoes = p.observacoes;
        dto.clienteDecisaoEm = p.clienteDecisaoEm;
        dto.clienteDecisaoMotivo = p.clienteDecisaoMotivo;
        dto.aditivos = propostaPortalV11Service.listarAditivos(usuario.id, p.id);
        dto.anexos = propostaPortalV11Service.listarAnexos(usuario.id, p.id);
        return dto;
    }

    private void fillDecisaoFlags(PropostaExternaDto dto, PropostaComercial p, UsuarioExterno usuario) {
        dto.clienteDecisaoEm = p.clienteDecisaoEm;
        dto.clienteDecisaoMotivo = p.clienteDecisaoMotivo;
        boolean enviada = STATUS_ENVIADA.equalsIgnoreCase(nullToEmpty(p.status));
        dto.podeAprovar = enviada;
        dto.podeRejeitar = enviada;
    }

    private PropostaExternaDto.OsVinculoResumo buildOsVinculo(Long osId) {
        return buildOsVinculo(osId, null);
    }

    private PropostaExternaDto.OsVinculoResumo buildOsVinculo(Long osId, Map<Long, OS> oss) {
        if (osId == null) {
            return null;
        }
        OS os = oss != null ? oss.get(osId) : OS.findById(osId);
        if (os == null) {
            return null;
        }
        PropostaExternaDto.OsVinculoResumo r = new PropostaExternaDto.OsVinculoResumo();
        r.id = os.id;
        r.dtAbertura = os.dtAbertura;
        r.dataFechamento = os.dataFechamento;
        r.clienteNome = os.clienteNome;
        r.status = os.dataFechamento != null ? "FECHADA" : (Boolean.FALSE.equals(os.isActive) ? "INATIVA" : "ABERTA");
        return r;
    }

    private UsuarioExterno requireUsuario(Integer id) {
        UsuarioExterno u = UsuarioExterno.findById(id);
        if (u == null || Boolean.FALSE.equals(u.ativo)) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.USER_EXTERNO_NOT_FOUND));
        }
        return u;
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
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

    private static String truncate(String s, int max) {
        if (s == null) {
            return null;
        }
        return s.length() <= max ? s : s.substring(0, max);
    }
}
