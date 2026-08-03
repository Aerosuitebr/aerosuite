package com.aerosuite.integration.evolution;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Configuração global da plataforma Evolution API (chave administrativa, URL base).
 * Credenciais por tenant ficam em {@link com.aerosuite.domain.TenantWhatsAppConnection}.
 */
@ApplicationScoped
public class EvolutionPlatformConfig {

    @ConfigProperty(name = "aero.suite.evolution.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "aero.suite.evolution.api-base-url", defaultValue = "")
    String apiBaseUrl;

    @ConfigProperty(name = "aero.suite.evolution.admin-api-key", defaultValue = "")
    String adminApiKey;

    @ConfigProperty(name = "aero.suite.evolution.webhook-base-url", defaultValue = "none")
    String webhookBaseUrl;

    @ConfigProperty(name = "aero.suite.evolution.connect-timeout-seconds", defaultValue = "30")
    int connectTimeoutSeconds;

    @ConfigProperty(name = "aero.suite.evolution.request-timeout-seconds", defaultValue = "60")
    int requestTimeoutSeconds;

    @ConfigProperty(name = "aero.suite.evolution.media-request-timeout-seconds", defaultValue = "120")
    int mediaRequestTimeoutSeconds;

    @ConfigProperty(name = "aero.suite.evolution.sync.enabled", defaultValue = "true")
    boolean syncEnabled;

    public boolean isPlatformEnabled() {
        return enabled;
    }

    public boolean isConfigured() {
        return enabled
                && apiBaseUrl != null
                && !apiBaseUrl.isBlank()
                && !"none".equalsIgnoreCase(apiBaseUrl.trim())
                && adminApiKey != null
                && !adminApiKey.isBlank()
                && !"none".equalsIgnoreCase(adminApiKey.trim());
    }

    public String getApiBaseUrl() {
        return normalizeBase(apiBaseUrl);
    }

    public String getAdminApiKey() {
        return adminApiKey != null ? adminApiKey.trim() : "";
    }

    /**
     * URL pública do nosso backend para receber webhooks Evolution.
     * Ex.: https://api.aerosuite.app/webhooks/evolution
     */
    public String resolveWebhookUrl() {
        if (webhookBaseUrl != null && !webhookBaseUrl.isBlank() && !"none".equalsIgnoreCase(webhookBaseUrl.trim())) {
            String base = webhookBaseUrl.endsWith("/")
                    ? webhookBaseUrl.substring(0, webhookBaseUrl.length() - 1)
                    : webhookBaseUrl.trim();
            return base + "/webhooks/evolution";
        }
        return "";
    }

    public int getConnectTimeoutSeconds() {
        return Math.max(5, connectTimeoutSeconds);
    }

    public int getRequestTimeoutSeconds() {
        return Math.max(10, requestTimeoutSeconds);
    }

    public int getMediaRequestTimeoutSeconds() {
        return Math.max(30, mediaRequestTimeoutSeconds);
    }

    public boolean isSyncEnabled() {
        return syncEnabled;
    }

    private static String normalizeBase(String url) {
        if (url == null || url.isBlank()) {
            return "";
        }
        return url.endsWith("/") ? url.substring(0, url.length() - 1) : url.trim();
    }
}
