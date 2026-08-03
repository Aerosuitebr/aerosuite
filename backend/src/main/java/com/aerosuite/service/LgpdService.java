package com.aerosuite.service;

import com.aerosuite.domain.LgpdSolicitacao;
import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioConsentimentoLgpd;
import com.aerosuite.dto.LgpdAceiteRequest;
import com.aerosuite.dto.LgpdDocumentDto;
import com.aerosuite.dto.LgpdSolicitacaoDto;
import com.aerosuite.dto.LgpdSolicitacaoRequest;
import com.aerosuite.dto.LgpdStatusDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.p1.LgpdDocumentVersions;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class LgpdService {

    @Inject
    LgpdSolicitacaoProcessor lgpdSolicitacaoProcessor;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    EntityManager entityManager;

    public LgpdDocumentDto getTermos() {
        return getTermosForTenantId(tenantDataAccess.currentTenantId(), "pt-BR");
    }

    public LgpdDocumentDto getPrivacidade() {
        return getPrivacidadeForTenantId(tenantDataAccess.currentTenantId(), "pt-BR");
    }

    public LgpdDocumentDto getTermosForTenantCodigo(String tenantCodigo, String locale) {
        return getTermosForTenantId(resolveTenantId(tenantCodigo), locale);
    }

    public LgpdDocumentDto getPrivacidadeForTenantCodigo(String tenantCodigo, String locale) {
        return getPrivacidadeForTenantId(resolveTenantId(tenantCodigo), locale);
    }

    public LgpdStatusDto statusForUsuario(Usuario usuario) {
        LgpdStatusDto dto = new LgpdStatusDto();
        dto.versaoTermosAtual = LgpdDocumentVersions.TERMOS;
        dto.versaoPrivacidadeAtual = LgpdDocumentVersions.PRIVACIDADE;
        dto.aceitePendente = usuario != null && needsConsent(usuario.id);
        return dto;
    }

    public boolean needsConsent(Integer usuarioId) {
        if (usuarioId == null) {
            return true;
        }
        long count = UsuarioConsentimentoLgpd.count(
                "usuarioId = ?1 and versaoTermos = ?2 and versaoPrivacidade = ?3",
                usuarioId,
                LgpdDocumentVersions.TERMOS,
                LgpdDocumentVersions.PRIVACIDADE);
        return count == 0;
    }

    @Transactional
    public void registrarAceite(Usuario usuario, LgpdAceiteRequest req, String ip, String userAgent) {
        if (usuario == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_USER_INVALID));
        }
        if (req == null || !Boolean.TRUE.equals(req.aceito)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_TERMS_REQUIRED));
        }
        if (!LgpdDocumentVersions.TERMOS.equals(req.versaoTermos)
                || !LgpdDocumentVersions.PRIVACIDADE.equals(req.versaoPrivacidade)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_VERSION_OUTDATED));
        }
        UsuarioConsentimentoLgpd existing = UsuarioConsentimentoLgpd.find(
                        "usuarioId = ?1 and versaoTermos = ?2 and versaoPrivacidade = ?3",
                        usuario.id,
                        req.versaoTermos,
                        req.versaoPrivacidade)
                .firstResult();
        if (existing != null) {
            return;
        }
        UsuarioConsentimentoLgpd c = new UsuarioConsentimentoLgpd();
        c.usuarioId = usuario.id;
        c.tenantId = usuario.orgTenantId;
        c.versaoTermos = req.versaoTermos;
        c.versaoPrivacidade = req.versaoPrivacidade;
        c.aceiteEm = LocalDateTime.now();
        c.ipOrigem = ip;
        c.userAgent = userAgent != null && userAgent.length() > 512 ? userAgent.substring(0, 512) : userAgent;
        c.persist();
    }

    @Transactional
    public LgpdSolicitacaoDto criarSolicitacao(Usuario usuario, LgpdSolicitacaoRequest req) {
        if (req == null || req.tipo == null || req.tipo.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_REQUEST_TYPE_REQUIRED));
        }
        String tipo = req.tipo.trim().toUpperCase(Locale.ROOT);
        if (!"EXPORT".equals(tipo) && !"DELETE".equals(tipo)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_REQUEST_TYPE_INVALID));
        }
        LgpdSolicitacao s = new LgpdSolicitacao();
        s.tenantId = usuario.orgTenantId;
        s.usuarioId = usuario.id;
        s.email = usuario.email;
        s.tipo = tipo;
        s.status = "PENDING";
        s.observacao = req.observacao;
        s.persist();
        lgpdSolicitacaoProcessor.processOne(s.id);
        s = LgpdSolicitacao.findById(s.id);
        return toDto(s);
    }

    public Path resolveExportFile(long solicitacaoId, Integer usuarioId) throws IOException {
        LgpdSolicitacao s = LgpdSolicitacao.findById(solicitacaoId);
        if (s == null || !s.usuarioId.equals(usuarioId)) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_REQUEST_NOT_FOUND));
        }
        if (!"COMPLETED".equals(s.status) || s.resultArtifact == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_EXPORT_NOT_READY));
        }
        Path path = lgpdSolicitacaoProcessor.resolveArtifactPath(s.resultArtifact);
        if (!Files.isRegularFile(path)) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_EXPORT_FILE_NOT_FOUND));
        }
        return path;
    }

    @SuppressWarnings("unchecked")
    public List<LgpdSolicitacaoDto> listarMinhasSolicitacoes(Integer usuarioId) {
        List<LgpdSolicitacao> rows =
                (List<LgpdSolicitacao>) (List<?>) LgpdSolicitacao.list("usuarioId = ?1 order by createdAt desc", usuarioId);
        return rows.stream().map(LgpdService::toDto).toList();
    }

    private LgpdDocumentDto getTermosForTenantId(long tenantId, String locale) {
        String loc = com.aerosuite.i18n.UserLocaleResolver.normalize(locale);
        String custom = loadCustomTermos(tenantId);
        if (custom != null) {
            return document("termos", LgpdDocumentVersions.TERMOS, custom, loc);
        }
        return document(
                "termos",
                LgpdDocumentVersions.TERMOS,
                com.aerosuite.i18n.LgpdDefaultDocuments.termosBody(loc),
                loc);
    }

    private LgpdDocumentDto getPrivacidadeForTenantId(long tenantId, String locale) {
        String loc = com.aerosuite.i18n.UserLocaleResolver.normalize(locale);
        String custom = loadCustomPrivacidade(tenantId);
        if (custom != null) {
            return document("privacidade", LgpdDocumentVersions.PRIVACIDADE, custom, loc);
        }
        return document(
                "privacidade",
                LgpdDocumentVersions.PRIVACIDADE,
                com.aerosuite.i18n.LgpdDefaultDocuments.privacidadeBody(loc),
                loc);
    }

    @SuppressWarnings("unchecked")
    private String loadCustomTermos(long tenantId) {
        List<Object[]> rows = entityManager
                .createNativeQuery(
                        "SELECT lgpd_termos_text, lgpd_textos_customizados FROM sistema_empresa_config WHERE tenant_id = :tid")
                .setParameter("tid", tenantId)
                .getResultList();
        if (rows.isEmpty()) {
            return null;
        }
        Object[] row = rows.get(0);
        if (!isSqlTrue(row[1]) || row[0] == null) {
            return null;
        }
        String text = row[0].toString().trim();
        return text.isEmpty() ? null : text;
    }

    @SuppressWarnings("unchecked")
    private String loadCustomPrivacidade(long tenantId) {
        List<Object[]> rows = entityManager
                .createNativeQuery(
                        "SELECT lgpd_privacidade_text, lgpd_textos_customizados FROM sistema_empresa_config WHERE tenant_id = :tid")
                .setParameter("tid", tenantId)
                .getResultList();
        if (rows.isEmpty()) {
            return null;
        }
        Object[] row = rows.get(0);
        if (!isSqlTrue(row[1]) || row[0] == null) {
            return null;
        }
        String text = row[0].toString().trim();
        return text.isEmpty() ? null : text;
    }

    /** MySQL TINYINT(1)/BOOLEAN pode vir como {@link Boolean} ou {@link Number} no native query. */
    static boolean isSqlTrue(Object value) {
        if (value == null) {
            return false;
        }
        if (value instanceof Boolean b) {
            return b;
        }
        if (value instanceof Number n) {
            return n.intValue() != 0;
        }
        return Boolean.parseBoolean(value.toString());
    }

    private static long resolveTenantId(String tenantCodigo) {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return TenantConstants.DEFAULT_TENANT_ID;
        }
        Tenant t = Tenant.find("codigo = ?1 and ativo = true", tenantCodigo.trim().toLowerCase(Locale.ROOT))
                .firstResult();
        return t != null && t.id != null ? t.id : TenantConstants.DEFAULT_TENANT_ID;
    }

    private static LgpdSolicitacaoDto toDto(LgpdSolicitacao s) {
        LgpdSolicitacaoDto d = new LgpdSolicitacaoDto();
        d.id = s.id;
        d.tipo = s.tipo;
        d.status = s.status;
        d.createdAt = s.createdAt;
        d.processedAt = s.processedAt;
        d.resultArtifact = s.resultArtifact;
        d.errorMessage = s.errorMessage;
        d.downloadAvailable = "COMPLETED".equals(s.status) && s.resultArtifact != null;
        return d;
    }

    private static LgpdDocumentDto document(String tipo, String versao, String texto, String locale) {
        LgpdDocumentDto d = new LgpdDocumentDto();
        d.tipo = tipo;
        d.versao = versao;
        d.titulo = com.aerosuite.i18n.LgpdDefaultDocuments.title(tipo, locale);
        d.conteudo = texto;
        return d;
    }
}
