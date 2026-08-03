package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.BlingSyncJob;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Map;
import org.jboss.logging.Logger;

@ApplicationScoped
public class BlingWebhookProcessor {

    private static final Logger LOG = Logger.getLogger(BlingWebhookProcessor.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    BlingContactSyncService contactSyncService;

    @Inject
    PropostaBlingPedidoService pedidoService;

    @Inject
    BlingFiscalSyncService fiscalSyncService;

    public void processJob(BlingSyncJob job) {
        if (job.tenantId == null) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_NO_TENANT));
        }
        try {
            JsonNode payload = MAPPER.readTree(job.payloadJson);
            if (BlingSyncJobService.TYPE_WEBHOOK_EVENT.equals(job.jobType)) {
                processWebhookEvent(job.tenantId, payload);
            } else if (BlingSyncJobService.TYPE_IMPORT_CONTATO.equals(job.jobType)) {
                long contatoId = payload.path("blingContatoId").asLong(0);
                if (contatoId <= 0) {
                    throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_JOB_NO_CONTACT_ID));
                }
                Integer userId = payload.has("userId") && !payload.get("userId").isNull()
                        ? payload.get("userId").asInt()
                        : null;
                contactSyncService.importContact(job.tenantId, contatoId, userId);
            } else {
                LOG.infof("Tipo de job Bling não tratado: %s", job.jobType);
            }
        } catch (RuntimeException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(e.getMessage(), e);
        }
    }

    private void processWebhookEvent(long tenantId, JsonNode payload) {
        String eventType = text(payload, "eventType");
        if (eventType == null) {
            eventType = text(payload, "event");
        }
        JsonNode eventPayload = payload.get("payload");
        if (eventPayload == null) {
            eventPayload = payload.get("body");
        }
        if (eventPayload == null) {
            eventPayload = payload;
        }
        if (BlingContactSyncService.isContactEvent(eventType, eventPayload)) {
            contactSyncService.processWebhookContactEvent(tenantId, eventPayload);
            return;
        }
        if (PropostaBlingPedidoService.isPedidoEvent(eventType, eventPayload)) {
            long pedidoId = PropostaBlingPedidoService.extractPedidoId(eventPayload);
            if (pedidoId <= 0) {
                pedidoId = payload.path("resourceId").asLong(0);
            }
            if (pedidoId > 0) {
                pedidoService.syncPedidoFromWebhook(tenantId, pedidoId);
            } else {
                LOG.warnf("Webhook pedido Bling sem ID resolvível: %s", eventType);
            }
            return;
        }
        if (BlingFiscalSyncService.isNfeEvent(eventType, eventPayload)) {
            fiscalSyncService.processNfeWebhook(tenantId, eventPayload);
            return;
        }
        LOG.debugf("Webhook Bling ignorado: %s", eventType);
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText(null);
    }
}
