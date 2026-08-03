package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.BlingWebhookEvent;
import com.aerosuite.integration.bling.BlingPlatformConfig;
import com.aerosuite.integration.bling.BlingSyncStatusDto;
import com.aerosuite.integration.bling.BlingTenantApiClient;
import com.aerosuite.integration.bling.BlingCompanyInfoDto;
import com.aerosuite.domain.BlingNfeRegistro;
import com.aerosuite.domain.ClientePropostaBlingMap;
import com.aerosuite.domain.PropostaBlingPedido;
import com.aerosuite.domain.TenantBlingConnection;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.Map;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * P5.5+ — recepção multi-tenant, fila de retentativa e resolução de tenant via companyId.
 */
@ApplicationScoped
public class BlingWebhookService {

    private static final Logger LOG = Logger.getLogger(BlingWebhookService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    BlingPlatformConfig platformConfig;

    @Inject
    BlingWebhookTenantResolver tenantResolver;

    @Inject
    BlingSyncJobService syncJobService;

    @Inject
    BlingTenantApiClient tenantApiClient;

    @ConfigProperty(name = "aero.suite.bling.webhook.enabled", defaultValue = "false")
    boolean webhookEnabled;

    @Transactional
    public void receber(String rawBody, String signatureHeader, String tenantCodigo) {
        if (!webhookEnabled) {
            LOG.debug("Webhook Bling desabilitado — evento ignorado");
            return;
        }
        if (!validarAssinatura(rawBody, signatureHeader)) {
            LOG.warn("Webhook Bling: assinatura inválida");
            throw new jakarta.ws.rs.ForbiddenException("bling.webhook.assinatura_invalida");
        }

        JsonNode root;
        try {
            root = MAPPER.readTree(rawBody);
        } catch (Exception e) {
            throw new jakarta.ws.rs.BadRequestException("bling.webhook.payload_invalido");
        }

        String eventId = text(root, "eventId");
        if (eventId == null || eventId.isBlank()) {
            eventId = text(root, "id");
        }
        if (eventId == null || eventId.isBlank()) {
            eventId = "hash-" + Integer.toHexString(rawBody.hashCode());
        }

        if (BlingWebhookEvent.count("eventId = ?1", eventId) > 0) {
            LOG.infof("Webhook Bling duplicado ignorado: %s", eventId);
            return;
        }

        String eventType = text(root, "event");
        if (eventType == null || eventType.isBlank()) {
            eventType = text(root, "tipo");
        }
        if (eventType == null || eventType.isBlank()) {
            eventType = "desconhecido";
        }

        String resourceId = extrairResourceId(root);
        Long tenantId = tenantResolver.resolve(rawBody, tenantCodigo);

        BlingWebhookEvent row = new BlingWebhookEvent();
        row.tenantId = tenantId != null ? tenantId : com.aerosuite.domain.TenantConstants.DEFAULT_TENANT_ID;
        row.eventId = eventId;
        row.eventType = eventType;
        row.resourceId = resourceId;
        row.payloadJson = rawBody;
        row.signatureOk = true;
        row.processingStatus = tenantId != null ? "QUEUED" : "UNRESOLVED";
        row.processNote = tenantId != null
                ? "Enfileirado para processamento assíncrono"
                : "Tenant não resolvido (companyId ou código ausente)";
        row.persist();

        if (tenantId != null) {
            Map<String, Object> jobPayload = new HashMap<>();
            jobPayload.put("eventType", eventType);
            jobPayload.put("resourceId", resourceId);
            jobPayload.put("payload", root);
            syncJobService.enqueue(tenantId, BlingSyncJobService.TYPE_WEBHOOK_EVENT, jobPayload, row.id);
        }

        LOG.infof("Webhook Bling registrado: %s / %s tenant=%s", eventType, eventId, tenantId);
    }

    @Transactional
    public void refreshCompanyProfile(long tenantId) {
        try {
            BlingCompanyInfoDto info = tenantApiClient.fetchCompanyInfo(tenantId);
            if (info == null) {
                return;
            }
            TenantBlingConnection conn = TenantBlingConnection.findForTenant(tenantId);
            if (conn == null) {
                return;
            }
            if (info.companyId != null && !info.companyId.isBlank()) {
                conn.blingCompanyId = info.companyId.trim();
            }
            if (info.companyName != null && !info.companyName.isBlank()) {
                conn.blingCompanyName = info.companyName.trim();
            }
            conn.flush();
        } catch (Exception e) {
            LOG.warnf(e, "Não foi possível obter companyId Bling para tenant %d", tenantId);
        }
    }

    public BlingSyncStatusDto syncStatus(long tenantId) {
        BlingSyncStatusDto dto = new BlingSyncStatusDto();
        Map<String, Long> counts = syncJobService.countByStatusForTenant(tenantId);
        dto.pendingJobs = counts.getOrDefault("pending", 0L);
        dto.failedJobs = counts.getOrDefault("failed", 0L);
        dto.deadJobs = counts.getOrDefault("dead", 0L);
        dto.mappedContacts = ClientePropostaBlingMap.count("tenantId = ?1", tenantId);
        dto.linkedPedidos = PropostaBlingPedido.count("tenantId = ?1", tenantId);
        dto.nfeRegistros = BlingNfeRegistro.count("tenantId = ?1", tenantId);
        BlingWebhookEvent last = BlingWebhookEvent.find(
                        "tenantId = ?1 order by createdAt desc", tenantId)
                .firstResult();
        dto.lastWebhookAt = last != null && last.createdAt != null ? last.createdAt.toString() : null;
        dto.message = dto.deadJobs > 0
                ? "Existem jobs com falha permanente — verifique logs ou reconecte a Bling"
                : null;
        return dto;
    }

    boolean validarAssinatura(String rawBody, String signatureHeader) {
        String secret = platformConfig.getClientSecret();
        if (secret == null || secret.isBlank()) {
            secret = platformConfig.getLegacyAccessToken().orElse(null);
        }
        if (secret == null || secret.isBlank()) {
            LOG.warn("Webhook Bling: client-secret não configurado");
            return false;
        }
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        String expected = hmacSha256Hex(rawBody, secret);
        String received = signatureHeader.trim();
        if (received.startsWith("sha256=")) {
            received = received.substring(7);
        }
        return expected.equalsIgnoreCase(received);
    }

    private static String extrairResourceId(JsonNode root) {
        JsonNode data = root.get("data");
        if (data != null) {
            String id = text(data, "id");
            if (id != null) {
                return id;
            }
        }
        return text(root, "resourceId");
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText();
    }

    private static String hmacSha256Hex(String payload, String secret) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_HMAC_FAILED, e.getMessage()), e);
        }
    }
}
