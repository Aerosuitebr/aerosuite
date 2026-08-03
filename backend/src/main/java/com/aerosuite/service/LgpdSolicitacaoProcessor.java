package com.aerosuite.service;

import com.aerosuite.domain.LgpdSolicitacao;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioConsentimentoLgpd;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class LgpdSolicitacaoProcessor {

    private static final Logger LOG = Logger.getLogger(LgpdSolicitacaoProcessor.class);

    @Inject
    TenantHibernateScope tenantHibernateScope;

    @ConfigProperty(name = "aero.suite.lgpd.storage-dir", defaultValue = "lgpd-exports")
    String storageDir;

    private final ObjectMapper mapper = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    @Transactional
    public int processPendingBatch(int limit) {
        @SuppressWarnings("unchecked")
        List<LgpdSolicitacao> pending = (List<LgpdSolicitacao>) (List<?>) LgpdSolicitacao.find(
                        "status = ?1 order by createdAt asc", "PENDING")
                .page(0, limit)
                .list();
        int done = 0;
        for (LgpdSolicitacao s : pending) {
            try {
                processOne(s.id);
                done++;
            } catch (Exception e) {
                LOG.warnf(e, "LGPD solicitação %d falhou", s.id);
            }
        }
        return done;
    }

    @Transactional
    public void processOne(long solicitudId) {
        LgpdSolicitacao s = LgpdSolicitacao.findById(solicitudId);
        if (s == null || !"PENDING".equals(s.status)) {
            return;
        }
        s.status = "PROCESSING";
        s.persist();

        try {
            if ("EXPORT".equals(s.tipo)) {
                runExport(s);
            } else if ("DELETE".equals(s.tipo)) {
                runDelete(s);
            } else {
                fail(s, "Tipo desconhecido: " + s.tipo);
            }
        } catch (Exception e) {
            fail(s, e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName());
        }
    }

    private void runExport(LgpdSolicitacao s) throws IOException {
        final String[] artifact = { null };
        tenantHibernateScope.runInNewTransaction(s.tenantId, () -> {
            try {
                Usuario u = Usuario.findById(s.usuarioId);
                if (u == null) {
                    throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_EXPORT_USER_NOT_FOUND));
                }
                Map<String, Object> payload = buildExportPayload(u);
                String fileName = "export-" + s.tenantId + "-" + s.usuarioId + "-" + s.id + ".json";
                Path dir = Path.of(storageDir).toAbsolutePath().normalize();
                Files.createDirectories(dir);
                Path file = dir.resolve(fileName);
                Files.writeString(
                        file,
                        mapper.writerWithDefaultPrettyPrinter().writeValueAsString(payload),
                        StandardCharsets.UTF_8);
                artifact[0] = fileName;
            } catch (IOException e) {
                throw new IllegalStateException(
                        ApiI18nMessages.encode(ApiI18nMessages.LGPD_EXPORT_WRITE_FAILED), e);
            }
        });
        s.status = "COMPLETED";
        s.resultArtifact = artifact[0];
        s.processedAt = LocalDateTime.now();
        s.errorMessage = null;
        s.persist();
    }

    private void runDelete(LgpdSolicitacao s) {
        tenantHibernateScope.runInNewTransaction(s.tenantId, () -> {
            Usuario u = Usuario.findById(s.usuarioId);
            if (u == null) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_EXPORT_USER_NOT_FOUND));
            }
            u.ativo = false;
            u.email = "deleted+" + u.id + "@anonymized.local";
            u.nome = "Utilizador removido (LGPD)";
            u.senha = "";
            u.persist();
        });
        s.status = "COMPLETED";
        s.resultArtifact = null;
        s.processedAt = LocalDateTime.now();
        s.errorMessage = null;
        s.persist();
    }

    private Map<String, Object> buildExportPayload(Usuario u) {
        Map<String, Object> root = new HashMap<>();
        root.put("usuarioId", u.id);
        root.put("email", u.email);
        root.put("nome", u.nome);
        root.put("tenantId", u.orgTenantId);
        root.put("dataCadastro", u.dataCadastro);
        root.put("ultimoAcesso", u.ultimoAcesso);
        root.put("ativo", u.ativo);
        if (u.perfil != null) {
            root.put("perfilCodigo", u.perfil.getCodigo());
        }
        @SuppressWarnings("unchecked")
        List<UsuarioConsentimentoLgpd> consents = (List<UsuarioConsentimentoLgpd>) (List<?>)
                UsuarioConsentimentoLgpd.list("usuarioId = ?1", u.id);
        root.put("consentimentos", consents);
        root.put("exportedAt", LocalDateTime.now());
        return root;
    }

    private void fail(LgpdSolicitacao s, String message) {
        s.status = "FAILED";
        s.errorMessage = message;
        s.processedAt = LocalDateTime.now();
        s.persist();
    }

    public Path resolveArtifactPath(String artifactFileName) {
        if (artifactFileName == null || artifactFileName.isBlank() || artifactFileName.contains("..")) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_ARTIFACT_INVALID));
        }
        return Path.of(storageDir).toAbsolutePath().normalize().resolve(artifactFileName);
    }
}
