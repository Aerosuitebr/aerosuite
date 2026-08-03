package com.aerosuite.integration.evolution.dto;

import java.util.List;

public class EvolutionSetWebhookRequest {

    public WebhookConfig webhook;

    public static EvolutionSetWebhookRequest connectionUpdates(String url) {
        EvolutionSetWebhookRequest req = new EvolutionSetWebhookRequest();
        WebhookConfig cfg = new WebhookConfig();
        cfg.enabled = true;
        cfg.url = url;
        cfg.webhookByEvents = false;
        cfg.events = List.of("CONNECTION_UPDATE", "QRCODE_UPDATED");
        req.webhook = cfg;
        return req;
    }

    public static class WebhookConfig {
        public boolean enabled;
        public String url;
        public boolean webhookByEvents;
        public List<String> events;
    }
}
