package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.math.BigDecimal;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * P4.2 v1.1 — aditivos e upload de anexos no portal externo.
 */
@ApplicationScoped
public class PropostaPortalV11Service {

    private static final Set<String> STATUS_ADITIVO_PERMITIDO = Set.of("APROVADA");
    private static final Set<String> STATUS_ANEXO_PERMITIDO = Set.of("ENVIADA", "APROVADA");
    private static final String STATUS_PENDENTE = "PENDENTE";
    private static final String STATUS_APROVADO = "APROVADO";
    private static final String STATUS_REJEITADO = "REJEITADO";

    @Inject
    PropostaExternaPortalService propostaExternaPortalService;

    public List<PropostaAditivoDto> listarAditivosInterno(Long propostaId) {
        PropostaComercial proposta = requirePropostaInterno(propostaId);
        return PropostaComercialAditivo
                .<PropostaComercialAditivo>find("propostaId = ?1 order by createdAt desc", proposta.id)
                .list()
                .stream()
                .map(a -> toAditivoDtoInterno(a, proposta))
                .toList();
    }

    public List<PropostaAnexoDto> listarAnexosInterno(Long propostaId) {
        requirePropostaInterno(propostaId);
        return PropostaComercialAnexo
                .<PropostaComercialAnexo>find("propostaId = ?1 order by createdAt desc", propostaId)
                .list()
                .stream()
                .map(this::toAnexoDto)
                .toList();
    }

    public PropostaComercialAnexo requireAnexoInterno(Long propostaId, Long anexoId) {
        requirePropostaInterno(propostaId);
        PropostaComercialAnexo anexo = PropostaComercialAnexo.findById(anexoId);
        if (anexo == null || !anexo.propostaId.equals(propostaId)) {
            throw new NotFoundException(ApiI18nMessages.domain("proposta.anexo.error.nao_encontrado"));
        }
        return anexo;
    }

    @Transactional
    public PropostaAditivoDto criarAditivoOficina(Long propostaId, PropostaAditivoWriteDto body) {
        PropostaComercial proposta = PropostaComercial.findById(propostaId);
        if (proposta == null) {
            throw new NotFoundException(ApiI18nMessages.domain("proposta.aditivo.error.proposta_nao_encontrada"));
        }
        if (!"APROVADA".equalsIgnoreCase(nullToEmpty(proposta.status))) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.aditivo.error.proposta_status"));
        }
        if (body == null || body.descricao == null || body.descricao.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.aditivo.error.descricao_obrigatoria"));
        }
        PropostaComercialAditivo ad = new PropostaComercialAditivo();
        ad.propostaId = proposta.id;
        ad.descricao = body.descricao.trim();
        ad.valor = body.valor;
        ad.status = STATUS_PENDENTE;
        ad.solicitadoPorExternoId = null;
        ad.persist();
        return toAditivoDto(ad, proposta);
    }

    public List<PropostaAditivoDto> listarAditivos(Integer usuarioExternoId, Long propostaId) {
        PropostaComercial proposta = requirePropostaAcessivel(usuarioExternoId, propostaId);
        return PropostaComercialAditivo
                .<PropostaComercialAditivo>find("propostaId = ?1 order by createdAt desc", proposta.id)
                .list()
                .stream()
                .map(a -> toAditivoDto(a, proposta))
                .toList();
    }

    @Transactional
    public PropostaAditivoDto solicitarAditivo(
            Integer usuarioExternoId, Long propostaId, PropostaAditivoWriteDto body) {
        UsuarioExterno usuario = requireUsuario(usuarioExternoId);
        PropostaComercial proposta = requirePropostaAcessivel(usuarioExternoId, propostaId);
        if (!STATUS_ADITIVO_PERMITIDO.contains(nullToEmpty(proposta.status).toUpperCase(Locale.ROOT))) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.aditivo.error.proposta_status"));
        }
        if (body == null || body.descricao == null || body.descricao.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.aditivo.error.descricao_obrigatoria"));
        }

        PropostaComercialAditivo ad = new PropostaComercialAditivo();
        ad.propostaId = proposta.id;
        ad.descricao = body.descricao.trim();
        ad.valor = body.valor;
        ad.status = STATUS_PENDENTE;
        ad.solicitadoPorExternoId = usuario.id;
        ad.persist();

        LogAcessoExterno.registrarAcesso(
                usuario, "PROPOSTA_ADITIVO_SOLICITADO", proposta.id, "PROPOSTA_COMERCIAL", null, null, ad.descricao);

        return toAditivoDto(ad, proposta);
    }

    @Transactional
    public PropostaAditivoDto decidirAditivo(
            Integer usuarioExternoId,
            Long propostaId,
            Long aditivoId,
            boolean aprovar,
            PropostaExternaDecisaoRequest body) {
        PropostaComercial proposta = requirePropostaAcessivel(usuarioExternoId, propostaId);
        PropostaComercialAditivo ad = PropostaComercialAditivo.findById(aditivoId);
        if (ad == null || !ad.propostaId.equals(proposta.id)) {
            throw new NotFoundException(ApiI18nMessages.domain("proposta.aditivo.error.nao_encontrado"));
        }
        if (!STATUS_PENDENTE.equalsIgnoreCase(ad.status)) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.aditivo.error.ja_decidido"));
        }
        if (ad.solicitadoPorExternoId != null) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.aditivo.error.nao_pode_decidir_proprio"));
        }

        String motivo = body != null && body.motivo != null ? body.motivo.trim() : "";
        if (!aprovar && motivo.isEmpty()) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.aditivo.error.motivo_rejeicao"));
        }

        ad.status = aprovar ? STATUS_APROVADO : STATUS_REJEITADO;
        ad.clienteDecisaoEm = LocalDateTime.now();
        ad.clienteDecisaoMotivo = motivo.isEmpty() ? null : motivo;
        ad.persist();

        return toAditivoDto(ad, proposta);
    }

    public List<PropostaAnexoDto> listarAnexos(Integer usuarioExternoId, Long propostaId) {
        requirePropostaAcessivel(usuarioExternoId, propostaId);
        return PropostaComercialAnexo
                .<PropostaComercialAnexo>find("propostaId = ?1 order by createdAt desc", propostaId)
                .list()
                .stream()
                .map(this::toAnexoDto)
                .toList();
    }

    @Transactional
    public PropostaAnexoDto enviarAnexo(Integer usuarioExternoId, Long propostaId, FileUpload file) {
        UsuarioExterno usuario = requireUsuario(usuarioExternoId);
        PropostaComercial proposta = requirePropostaAcessivel(usuarioExternoId, propostaId);
        String status = nullToEmpty(proposta.status).toUpperCase(Locale.ROOT);
        if (!STATUS_ANEXO_PERMITIDO.contains(status)) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.anexo.error.proposta_status"));
        }
        if (file == null || file.fileName() == null || file.uploadedFile() == null) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.anexo.error.arquivo_obrigatorio"));
        }

        String nome = sanitizeFileName(file.fileName());
        if (nome.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.anexo.error.arquivo_obrigatorio"));
        }

        try {
            Path dir = baseDir(proposta).resolve("anexos");
            Files.createDirectories(dir);
            String stored = System.currentTimeMillis() + "_" + nome;
            Path target = dir.resolve(stored);
            Files.copy(file.uploadedFile(), target, StandardCopyOption.REPLACE_EXISTING);

            PropostaComercialAnexo anexo = new PropostaComercialAnexo();
            anexo.propostaId = proposta.id;
            anexo.nomeArquivo = nome;
            anexo.caminhoRelativo = proposta.tenantId + "/" + proposta.id + "/anexos/" + stored;
            anexo.tamanhoBytes = Files.size(target);
            anexo.contentType = file.contentType();
            anexo.uploadedByExternoId = usuario.id;
            anexo.persist();

            LogAcessoExterno.registrarAcesso(
                    usuario, "PROPOSTA_ANEXO_UPLOAD", proposta.id, "PROPOSTA_COMERCIAL", null, null, nome);

            return toAnexoDto(anexo);
        } catch (IOException e) {
            throw new BadRequestException(ApiI18nMessages.domain("proposta.anexo.error.falha_gravar"));
        }
    }

    public Path resolverArquivo(PropostaComercialAnexo anexo) {
        return Path.of("data", "propostas", anexo.caminhoRelativo);
    }

    public PropostaComercialAnexo requireAnexo(Integer usuarioExternoId, Long propostaId, Long anexoId) {
        requirePropostaAcessivel(usuarioExternoId, propostaId);
        PropostaComercialAnexo anexo = PropostaComercialAnexo.findById(anexoId);
        if (anexo == null || !anexo.propostaId.equals(propostaId)) {
            throw new NotFoundException(ApiI18nMessages.domain("proposta.anexo.error.nao_encontrado"));
        }
        return anexo;
    }

    private Path baseDir(PropostaComercial proposta) {
        return Path.of("data", "propostas", proposta.tenantId, String.valueOf(proposta.id));
    }

    private static String sanitizeFileName(String name) {
        if (name == null) {
            return "";
        }
        String base = Path.of(name).getFileName().toString();
        return base.replaceAll("[^a-zA-Z0-9._\\-]", "_");
    }

    private PropostaAditivoDto toAditivoDtoInterno(PropostaComercialAditivo ad, PropostaComercial proposta) {
        PropostaAditivoDto dto = toAditivoDto(ad, proposta);
        dto.podeAprovar = false;
        dto.podeRejeitar = false;
        return dto;
    }

    private PropostaComercial requirePropostaInterno(Long propostaId) {
        PropostaComercial p = PropostaComercial.findById(propostaId);
        if (p == null) {
            throw new NotFoundException(ApiI18nMessages.domain("proposta.aditivo.error.proposta_nao_encontrada"));
        }
        return p;
    }

    private PropostaAditivoDto toAditivoDto(PropostaComercialAditivo ad, PropostaComercial proposta) {
        PropostaAditivoDto dto = new PropostaAditivoDto();
        dto.id = ad.id;
        dto.propostaId = ad.propostaId;
        dto.descricao = ad.descricao;
        dto.valor = ad.valor;
        dto.status = ad.status;
        dto.createdAt = ad.createdAt;
        dto.clienteDecisaoEm = ad.clienteDecisaoEm;
        dto.clienteDecisaoMotivo = ad.clienteDecisaoMotivo;
        boolean pendente = STATUS_PENDENTE.equalsIgnoreCase(ad.status);
        boolean propostaAprovada = "APROVADA".equalsIgnoreCase(nullToEmpty(proposta.status));
        boolean propostoPelaOficina = ad.solicitadoPorExternoId == null;
        dto.podeAprovar = pendente && propostaAprovada && propostoPelaOficina;
        dto.podeRejeitar = pendente && propostaAprovada && propostoPelaOficina;
        dto.solicitadoPeloCliente = ad.solicitadoPorExternoId != null;
        return dto;
    }

    private PropostaAnexoDto toAnexoDto(PropostaComercialAnexo a) {
        PropostaAnexoDto dto = new PropostaAnexoDto();
        dto.id = a.id;
        dto.nomeArquivo = a.nomeArquivo;
        dto.tamanhoBytes = a.tamanhoBytes;
        dto.contentType = a.contentType;
        dto.createdAt = a.createdAt;
        return dto;
    }

    private PropostaComercial requirePropostaAcessivel(Integer usuarioExternoId, Long propostaId) {
        propostaExternaPortalService.detalhe(usuarioExternoId, propostaId);
        PropostaComercial p = PropostaComercial.findById(propostaId);
        if (p == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PROPOSTA_PORTAL_NOT_FOUND));
        }
        return p;
    }

    private UsuarioExterno requireUsuario(Integer id) {
        UsuarioExterno u = UsuarioExterno.findById(id);
        if (u == null || u.ativo == null || !u.ativo) {
            throw new ForbiddenException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.EXTERNO_USER_INVALID));
        }
        return u;
    }

    private static String nullToEmpty(String s) {
        return s != null ? s : "";
    }
}
