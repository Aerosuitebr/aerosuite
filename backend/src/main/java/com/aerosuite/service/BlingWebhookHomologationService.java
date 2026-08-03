package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantBlingConnection;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.bling.BlingPlatformConfig;
import com.aerosuite.integration.bling.BlingSyncStatusDto;
import com.aerosuite.integration.bling.BlingWebhookHomologationDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Valida recepção HMAC + fila para homologação Bling em staging.
 */
@ApplicationScoped
public class BlingWebhookHomologationService {

    private static final Logger LOG = Logger.getLogger(BlingWebhookHomologationService.class);

    @Inject
    BlingWebhookService webhookService;

    @Inject
    BlingPlatformConfig platformConfig;

    @ConfigProperty(name = "aero.suite.bling.webhook.enabled", defaultValue = "false")
    boolean webhookEnabled;

    @ConfigProperty(name = "aero.suite.bling.sync.enabled", defaultValue = "false")
    boolean syncEnabled;

    @Transactional
    public BlingWebhookHomologationDto run(long tenantId) {
        BlingWebhookHomologationDto out = new BlingWebhookHomologationDto();
        out.webhookEnabled = webhookEnabled;
        out.syncEnabled = syncEnabled;

        Tenant tenant = Tenant.findById(tenantId);
        out.tenantCodigo = tenant != null ? tenant.codigo : null;
        out.webhookUrl = buildWebhookUrl(null);
        out.webhookUrlTenant = out.tenantCodigo != null ? buildWebhookUrl(out.tenantCodigo) : null;

        if (!webhookEnabled) {
            out.success = false;
            out.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_WEBHOOK_DISABLED);
            out.steps.add("AERO_SUITE_BLING_WEBHOOK_ENABLED=false — habilite no ambiente");
            return out;
        }

        webhookService.refreshCompanyProfile(tenantId);
        TenantBlingConnection conn = TenantBlingConnection.findForTenant(tenantId);
        out.blingCompanyId = conn != null ? conn.blingCompanyId : null;
        out.companyIdMapped = out.blingCompanyId != null && !out.blingCompanyId.isBlank();
        if (!out.companyIdMapped) {
            out.steps.add("companyId Bling ainda não mapeado — use URL /webhook/t/{codigo-tenant} temporariamente");
        } else {
            out.steps.add("companyId mapeado: " + out.blingCompanyId);
        }

        try {
            String eventId = "homolog-probe-" + UUID.randomUUID();
            String companyFragment = out.companyIdMapped
                    ? ",\"companyId\":\"" + escapeJson(out.blingCompanyId) + "\""
                    : "";
            String body = "{\"eventId\":\"" + eventId + "\",\"event\":\"contatos.atualizado\""
                    + companyFragment
                    + ",\"data\":{\"id\":\"0\"}}";
            String signature = sign(body);
            webhookService.receber(body, signature, out.tenantCodigo);
            out.probeAccepted = true;
            out.steps.add("Webhook de teste aceito (eventId=" + eventId + ")");
        } catch (Exception e) {
            out.probeAccepted = false;
            out.steps.add("Falha no webhook de teste: " + e.getMessage());
            LOG.warnf(e, "Probe webhook Bling tenant %d", tenantId);
        }

        BlingSyncStatusDto sync = webhookService.syncStatus(tenantId);
        out.pendingJobs = sync.pendingJobs;
        out.lastWebhookAt = sync.lastWebhookAt;

        out.success = out.probeAccepted;
        out.message = out.success
                ? ApiI18nMessages.encode(ApiI18nMessages.BLING_WEBHOOK_HOMOLOGATION_OK)
                : ApiI18nMessages.withDetail(ApiI18nMessages.BLING_WEBHOOK_HOMOLOGATION_FAILED,
                        out.steps.isEmpty() ? "probe_failed" : out.steps.get(out.steps.size() - 1));
        return out;
    }

    private String buildWebhookUrl(String tenantCodigo) {
        String apiBase = resolveApiBaseUrl();
        if (apiBase == null) {
            return null;
        }
        if (tenantCodigo != null && !tenantCodigo.isBlank()) {
            return apiBase + "/api/integracoes/bling/webhook/t/" + tenantCodigo.trim();
        }
        return apiBase + "/api/integracoes/bling/webhook";
    }

    private String resolveApiBaseUrl() {
        String redirect = platformConfig.getRedirectUri();
        if (redirect != null && redirect.contains("/api/integracoes/bling/oauth/callback")) {
            return redirect.replace("/api/integracoes/bling/oauth/callback", "").trim();
        }
        String frontend = platformConfig.getFrontendReturnUrl();
        if (frontend != null && !frontend.isBlank()) {
            int idx = frontend.indexOf("/configuracoes");
            if (idx > 0) {
                return frontend.substring(0, idx);
            }
            return frontend.replaceAll("/+$", "");
        }
        return null;
    }

    private String sign(String body) {
        String secret = platformConfig.getClientSecret();
        if (secret == null || secret.isBlank()) {
            secret = platformConfig.getLegacyAccessToken().orElse("");
        }
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(body.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return "sha256=" + java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String escapeJson(String value) {
        return value.replace("\\", "\\\\").replace("\"", "\\\"");
    }
}
