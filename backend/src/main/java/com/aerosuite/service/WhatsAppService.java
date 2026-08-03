package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.evolution.EvolutionPlatformConfig;
import com.aerosuite.integration.evolution.EvolutionService;
import com.aerosuite.integration.evolution.TenantWhatsAppConnectionService;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.MediaType;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

/**
 * Fachada de envio WhatsApp — delega para {@link EvolutionService} (multi-tenant)
 * ou mantém modo legado global ({@code whatsapp.api.*}) para compatibilidade.
 */
@ApplicationScoped
public class WhatsAppService {

    private static final Logger LOGGER = Logger.getLogger(WhatsAppService.class);

    @Inject
    EvolutionPlatformConfig evolutionPlatformConfig;

    @Inject
    EvolutionService evolutionService;

    @Inject
    TenantWhatsAppConnectionService tenantConnectionService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    @ConfigProperty(name = "whatsapp.api.enabled", defaultValue = "false")
    boolean whatsappApiEnabled;

    @Inject
    @ConfigProperty(name = "whatsapp.api.provider", defaultValue = "evolution")
    String whatsappApiProvider;

    @Inject
    @ConfigProperty(name = "whatsapp.api.url", defaultValue = "")
    String whatsappApiUrl;

    @Inject
    @ConfigProperty(name = "whatsapp.api.instance", defaultValue = "default")
    String whatsappApiInstance;

    @Inject
    @ConfigProperty(name = "whatsapp.api.token", defaultValue = "")
    String whatsappApiToken;

    private final HttpClient httpClient = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(30))
            .build();

    public boolean isApiConfigured() {
        if (useTenantEvolution()) {
            return evolutionService.isTenantConfigured(tenantDataAccess.currentTenantId());
        }
        return isLegacyApiConfigured();
    }

    public boolean sendTextMessage(String phoneNumber, String message) {
        if (useTenantEvolution()) {
            return evolutionService.sendTextMessage(phoneNumber, message);
        }
        return sendTextMessageLegacy(phoneNumber, message);
    }

    public boolean sendMessageWithPdf(String phoneNumber, String message, byte[] pdfBytes, String pdfFileName) {
        Map<String, Object> resultado = sendMessageWithPdfDetailed(phoneNumber, message, pdfBytes, pdfFileName);
        return Boolean.TRUE.equals(resultado.get("success"));
    }

    public Map<String, Object> sendMessageWithPdfDetailed(
            String phoneNumber, String message, byte[] pdfBytes, String pdfFileName) {
        if (useTenantEvolution()) {
            return evolutionService.enqueueMediaMessage(
                    phoneNumber,
                    message,
                    null,
                    pdfBytes,
                    pdfFileName != null ? pdfFileName : "documento.pdf",
                    "application/pdf");
        }
        return sendMessageWithPdfLegacy(phoneNumber, message, pdfBytes, pdfFileName);
    }

    private boolean useTenantEvolution() {
        return evolutionPlatformConfig.isConfigured()
                && tenantConnectionService.findForTenant(tenantDataAccess.currentTenantId()).isPresent();
    }

    private boolean isLegacyApiConfigured() {
        if (!whatsappApiEnabled) {
            return false;
        }
        if (whatsappApiUrl == null || whatsappApiUrl.isBlank() || "none".equalsIgnoreCase(whatsappApiUrl.trim())) {
            return false;
        }
        return whatsappApiToken != null
                && !whatsappApiToken.isBlank()
                && !"none".equalsIgnoreCase(whatsappApiToken.trim());
    }

    private boolean sendTextMessageLegacy(String phoneNumber, String message) {
        if (!whatsappApiEnabled) {
            LOGGER.warn("WhatsApp API não está habilitada. Configure whatsapp.api.enabled=true");
            return false;
        }
        try {
            String cleanPhone = EvolutionService.cleanPhoneNumber(phoneNumber);
            if ("evolution".equalsIgnoreCase(whatsappApiProvider)) {
                return sendViaEvolutionAPILegacy(cleanPhone, message, null, null);
            }
            LOGGER.error("Provedor WhatsApp legado não suportado: " + whatsappApiProvider);
            return false;
        } catch (Exception e) {
            LOGGER.error("Erro ao enviar mensagem WhatsApp: " + e.getMessage(), e);
            return false;
        }
    }

    private Map<String, Object> sendMessageWithPdfLegacy(
            String phoneNumber, String message, byte[] pdfBytes, String pdfFileName) {
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("success", false);

        if (!whatsappApiEnabled) {
            resultado.put("errorMessage", ApiI18nMessages.encode(ApiI18nMessages.WHATSAPP_NOT_ENABLED));
            return resultado;
        }
        if (!isLegacyApiConfigured()) {
            resultado.put(
                    "errorMessage",
                    ApiI18nMessages.encode(
                            whatsappApiUrl == null || whatsappApiUrl.isBlank()
                                    ? ApiI18nMessages.WHATSAPP_URL_NOT_CONFIGURED
                                    : ApiI18nMessages.WHATSAPP_TOKEN_NOT_CONFIGURED));
            return resultado;
        }

        try {
            String cleanPhone = EvolutionService.cleanPhoneNumber(phoneNumber);
            Map<String, Object> envio = sendViaEvolutionAPIDetailedLegacy(cleanPhone, message, pdfBytes, pdfFileName);
            boolean sucesso = Boolean.TRUE.equals(envio.get("success"));
            resultado.put("success", sucesso);
            if (!sucesso) {
                resultado.put("errorMessage", envio.get("errorMessage"));
            }
            return resultado;
        } catch (Exception e) {
            resultado.put(
                    "errorMessage",
                    ApiI18nMessages.withDetail(ApiI18nMessages.WHATSAPP_SEND_FAILED_DEFAULT, e.getMessage()));
            return resultado;
        }
    }

    private boolean sendViaEvolutionAPILegacy(String phoneNumber, String message, byte[] pdfBytes, String pdfFileName) {
        Map<String, Object> resultado = sendViaEvolutionAPIDetailedLegacy(phoneNumber, message, pdfBytes, pdfFileName);
        return Boolean.TRUE.equals(resultado.get("success"));
    }

    private Map<String, Object> sendViaEvolutionAPIDetailedLegacy(
            String phoneNumber, String message, byte[] pdfBytes, String pdfFileName) {
        Map<String, Object> resultado = new HashMap<>();
        resultado.put("success", false);

        try {
            String baseUrl = whatsappApiUrl.endsWith("/")
                    ? whatsappApiUrl.substring(0, whatsappApiUrl.length() - 1)
                    : whatsappApiUrl;

            String url = baseUrl + "/message/sendText/" + whatsappApiInstance;
            Map<String, Object> payload = new HashMap<>();
            payload.put("number", phoneNumber);
            payload.put("text", message);

            if (pdfBytes != null && pdfBytes.length > 0) {
                url = baseUrl + "/message/sendMedia/" + whatsappApiInstance;
                payload = new HashMap<>();
                payload.put("number", phoneNumber);
                payload.put("mediatype", "document");
                payload.put("media", Base64.getEncoder().encodeToString(pdfBytes));
                payload.put("fileName", pdfFileName != null ? pdfFileName : "documento.pdf");
                payload.put("caption", message);
                payload.put("mimetype", "application/pdf");
            }

            String jsonPayload = new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(payload);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(60))
                    .header("Content-Type", MediaType.APPLICATION_JSON)
                    .header("apikey", whatsappApiToken)
                    .header("Accept", MediaType.APPLICATION_JSON)
                    .POST(HttpRequest.BodyPublishers.ofString(jsonPayload, StandardCharsets.UTF_8))
                    .build();

            HttpResponse<String> response = httpClient.send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                resultado.put("success", true);
                return resultado;
            }
            String erroMsg = ApiI18nMessages.encode(
                    ApiI18nMessages.WHATSAPP_EVOLUTION_SEND_FAILED,
                    "status",
                    String.valueOf(response.statusCode()));
            resultado.put("errorMessage", erroMsg);
            return resultado;
        } catch (java.net.ConnectException e) {
            resultado.put(
                    "errorMessage",
                    ApiI18nMessages.encode(
                            ApiI18nMessages.WHATSAPP_EVOLUTION_CONNECT_ERROR,
                            Map.of("url", whatsappApiUrl != null ? whatsappApiUrl : "", "detail", e.getMessage())));
            return resultado;
        } catch (java.net.http.HttpTimeoutException e) {
            resultado.put("errorMessage", ApiI18nMessages.encode(ApiI18nMessages.WHATSAPP_EVOLUTION_TIMEOUT));
            return resultado;
        } catch (Exception e) {
            resultado.put(
                    "errorMessage",
                    ApiI18nMessages.withDetail(ApiI18nMessages.WHATSAPP_EVOLUTION_SEND_FAILED, e.getMessage()));
            return resultado;
        }
    }
}
