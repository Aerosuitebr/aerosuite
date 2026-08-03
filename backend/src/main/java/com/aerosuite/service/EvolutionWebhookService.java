package com.aerosuite.service;

import com.aerosuite.domain.WhatsAppConnectionStatus;
import com.aerosuite.integration.evolution.TenantWhatsAppConnectionService;
import com.aerosuite.integration.evolution.dto.EvolutionWebhookPayload;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

/**
 * Processa eventos webhook da Evolution API — principalmente {@code connection.update}.
 */
@ApplicationScoped
public class EvolutionWebhookService {

    private static final Logger LOG = Logger.getLogger(EvolutionWebhookService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Inject
    TenantWhatsAppConnectionService connectionService;

    public void receber(String rawBody) {
        if (rawBody == null || rawBody.isBlank()) {
            LOG.warn("Webhook Evolution: corpo vazio");
            return;
        }
        try {
            EvolutionWebhookPayload payload = MAPPER.readValue(rawBody, EvolutionWebhookPayload.class);
            if (payload == null) {
                return;
            }
            String event = normalizeEvent(payload.event);
            if ("connection.update".equals(event)) {
                handleConnectionUpdate(payload);
            } else if ("qrcode.updated".equals(event)) {
                handleQrCodeUpdate(payload);
            } else {
                LOG.debugf("Webhook Evolution ignorado: event=%s instance=%s", event, payload.instance);
            }
        } catch (Exception e) {
            LOG.warnf(e, "Webhook Evolution: falha ao processar payload");
        }
    }

    private void handleConnectionUpdate(EvolutionWebhookPayload payload) {
        String instanceName = resolveInstanceName(payload);
        if (instanceName == null) {
            return;
        }
        String state = extractConnectionState(payload.data);
        WhatsAppConnectionStatus status = WhatsAppConnectionStatus.fromEvolutionState(state);
        connectionService.updateStatusByInstanceName(instanceName, status);
        LOG.infof("Webhook Evolution connection.update: instance=%s state=%s -> %s",
                instanceName, state, status);
    }

    private void handleQrCodeUpdate(EvolutionWebhookPayload payload) {
        String instanceName = resolveInstanceName(payload);
        if (instanceName == null) {
            return;
        }
        connectionService.updateStatusByInstanceName(instanceName, WhatsAppConnectionStatus.CONNECTING);
    }

    private static String resolveInstanceName(EvolutionWebhookPayload payload) {
        if (payload.instance != null && !payload.instance.isBlank()) {
            return payload.instance.trim();
        }
        if (payload.data != null && payload.data.hasNonNull("instance")) {
            return payload.data.get("instance").asText();
        }
        return null;
    }

    private static String extractConnectionState(JsonNode data) {
        if (data == null) {
            return null;
        }
        if (data.hasNonNull("state")) {
            return data.get("state").asText();
        }
        if (data.hasNonNull("status")) {
            return data.get("status").asText();
        }
        return null;
    }

    private static String normalizeEvent(String event) {
        if (event == null) {
            return "";
        }
        return event.trim().toLowerCase().replace('_', '.');
    }
}
