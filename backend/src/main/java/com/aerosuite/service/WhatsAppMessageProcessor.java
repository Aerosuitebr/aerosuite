package com.aerosuite.service;

import com.aerosuite.domain.WhatsAppMessageJob;
import com.aerosuite.integration.evolution.EvolutionService;
import com.aerosuite.security.BackgroundTenantContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.Map;
import org.jboss.logging.Logger;

@ApplicationScoped
public class WhatsAppMessageProcessor {

    private static final Logger LOG = Logger.getLogger(WhatsAppMessageProcessor.class);

    @Inject
    EvolutionService evolutionService;

    @Inject
    WhatsAppMessageJobService jobService;

    public void processJob(WhatsAppMessageJob job) {
        Map<String, Object> payload = jobService.parsePayload(job);
        BackgroundTenantContext.runAs(job.tenantId, () -> {
            switch (job.jobType) {
                case WhatsAppMessageJob.TYPE_SEND_TEXT -> processText(job.tenantId, payload);
                case WhatsAppMessageJob.TYPE_SEND_MEDIA -> processMedia(job.tenantId, payload);
                default -> LOG.warnf("Tipo de job WhatsApp desconhecido: %s", job.jobType);
            }
        });
    }

    private void processText(long tenantId, Map<String, Object> payload) {
        String phone = stringVal(payload.get("phoneNumber"));
        String message = stringVal(payload.get("message"));
        evolutionService.sendTextForTenant(tenantId, phone, message);
    }

  /**
   * Processa envio de mídia. O MIME type no payload define o {@code mimetype} enviado à Evolution:
   * {@code application/pdf} para OS/propostas; {@code image/jpeg} ou {@code image/png} para fotos de peças.
   */
    private void processMedia(long tenantId, Map<String, Object> payload) {
        String phone = stringVal(payload.get("phoneNumber"));
        String caption = stringVal(payload.get("caption"));
        String mediaUrl = stringVal(payload.get("mediaUrl"));
        String mediaBase64 = stringVal(payload.get("mediaBase64"));
        String fileName = stringVal(payload.get("fileName"));
        String mimeType = stringVal(payload.get("mimeType"));
        if (mimeType == null || mimeType.isBlank()) {
            mimeType = "application/pdf";
        }
        evolutionService.sendMediaForTenant(
                tenantId, phone, caption, mediaUrl, mediaBase64, fileName, mimeType);
    }

    private static String stringVal(Object o) {
        return o != null ? String.valueOf(o) : null;
    }
}
