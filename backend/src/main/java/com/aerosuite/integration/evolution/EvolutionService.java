package com.aerosuite.integration.evolution;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantWhatsAppConnection;
import com.aerosuite.domain.WhatsAppConnectionStatus;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.integration.evolution.dto.EvolutionConnectResponse;
import com.aerosuite.integration.evolution.dto.EvolutionCreateInstanceRequest;
import com.aerosuite.integration.evolution.dto.EvolutionCreateInstanceResponse;
import com.aerosuite.integration.evolution.dto.EvolutionMediaType;
import com.aerosuite.integration.evolution.dto.EvolutionSendMediaRequest;
import com.aerosuite.integration.evolution.dto.EvolutionSendTextRequest;
import com.aerosuite.integration.evolution.dto.EvolutionSetWebhookRequest;
import com.aerosuite.integration.evolution.dto.TenantWhatsAppConnectionViewDto;
import com.aerosuite.integration.evolution.dto.WhatsAppQrCodeDto;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.service.WhatsAppBrandingFormatter;
import com.aerosuite.service.WhatsAppBrandingFormatter.WhatsAppLogoAsset;
import com.aerosuite.service.WhatsAppMessageJobService;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import org.jboss.logging.Logger;

/**
 * Camada de negócio da integração Evolution API — resolve credenciais do tenant atual
 * e orquestra criação de instância, QR Code, envios e desconexão.
 */
@ApplicationScoped
public class EvolutionService {

    private static final Logger LOG = Logger.getLogger(EvolutionService.class);

    @Inject
    EvolutionPlatformConfig platformConfig;

    @Inject
    EvolutionHttpClient httpClient;

    @Inject
    TenantWhatsAppConnectionService connectionService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    WhatsAppMessageJobService messageJobService;

    @Inject
    WhatsAppBrandingFormatter brandingFormatter;

    public boolean isTenantConfigured(long tenantId) {
        return platformConfig.isConfigured()
                && connectionService.findForTenant(tenantId).isPresent();
    }

    public boolean isTenantOperational(long tenantId) {
        return platformConfig.isConfigured() && connectionService.isOperational(tenantId);
    }

    public TenantWhatsAppConnectionViewDto getConnectionView(boolean canManage) {
        long tenantId = tenantDataAccess.currentTenantId();
        syncConnectionStateFromEvolution(tenantId);
        return connectionService.getConnectionView(tenantId, canManage);
    }

    @Transactional
    public TenantWhatsAppConnectionViewDto activateWhatsApp() {
        long tenantId = tenantDataAccess.currentTenantId();
        ensurePlatformReady();

        Tenant tenant = Tenant.findById(tenantId);
        if (tenant == null) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_NOT_FOUND));
        }

        Optional<TenantWhatsAppConnection> existing = connectionService.findForTenant(tenantId);
        if (existing.isPresent()) {
            return connectionService.getConnectionView(tenantId, true);
        }

        String instanceName = connectionService.buildInstanceName(tenant);
        String instanceToken = connectionService.generateInstanceToken();

        EvolutionCreateInstanceRequest req = new EvolutionCreateInstanceRequest(instanceName, instanceToken);
        String resolvedToken = instanceToken;
        try {
            EvolutionCreateInstanceResponse created = httpClient.createInstance(req);
            if (created != null && created.hash != null && created.hash.apikey != null && !created.hash.apikey.isBlank()) {
                resolvedToken = created.hash.apikey;
            }
        } catch (EvolutionApiException e) {
            if (!isInstanceAlreadyInUse(e)) {
                throw e;
            }
            LOG.warnf(
                    "Instancia Evolution %s ja existe — vinculando ao tenant %d",
                    instanceName,
                    tenantId);
            resolvedToken = httpClient.findInstanceToken(instanceName).orElse(instanceToken);
        }

        Integer usuarioId = internalUserContext.getUserId();
        connectionService.saveConnection(
                tenantId,
                instanceName,
                resolvedToken,
                WhatsAppConnectionStatus.CONNECTING,
                usuarioId);

        registerWebhook(instanceName);

        return connectionService.getConnectionView(tenantId, true);
    }

    public WhatsAppQrCodeDto fetchQrCode() {
        long tenantId = tenantDataAccess.currentTenantId();
        ensurePlatformReady();
        syncConnectionStateFromEvolution(tenantId);
        TenantWhatsAppConnection conn = requireConnection(tenantId);

        EvolutionConnectResponse response = httpClient.connectInstance(conn.whatsappInstanceName);
        connectionService.updateStatus(tenantId, WhatsAppConnectionStatus.CONNECTING);

        WhatsAppQrCodeDto dto = new WhatsAppQrCodeDto();
        dto.instanceName = conn.whatsappInstanceName;
        dto.status = WhatsAppConnectionStatus.CONNECTING.name();
        dto.qrCodeBase64 = firstNonBlank(
                response != null ? response.base64 : null,
                response != null ? response.code : null);
        dto.pairingCode = response != null ? response.pairingCode : null;
        return dto;
    }

    @Transactional
    public void disconnect() {
        long tenantId = tenantDataAccess.currentTenantId();
        ensurePlatformReady();
        TenantWhatsAppConnection conn = requireConnection(tenantId);

        try {
            httpClient.logoutInstance(conn.whatsappInstanceName);
        } catch (EvolutionApiException e) {
            LOG.warnf(e, "Logout Evolution falhou para tenant %d — atualizando status local", tenantId);
        }
        connectionService.updateStatus(tenantId, WhatsAppConnectionStatus.DISCONNECTED);
    }

    public boolean sendTextMessage(String phoneNumber, String message) {
        Map<String, Object> result = sendTextMessageDetailed(phoneNumber, message);
        return Boolean.TRUE.equals(result.get("success"));
    }

    public Map<String, Object> sendTextMessageDetailed(String phoneNumber, String message) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);

        long tenantId = tenantDataAccess.currentTenantId();
        if (!isTenantConfigured(tenantId)) {
            result.put("errorMessage", ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_TENANT_NOT_CONFIGURED));
            return result;
        }

        try {
            TenantWhatsAppCredentials creds = resolveCredentials(tenantId);
            String cleanPhone = cleanPhoneNumber(phoneNumber);
            sendBrandedText(creds, cleanPhone, message);
            result.put("success", true);
            return result;
        } catch (EvolutionApiException e) {
            handleSendFailure(tenantId, e);
            result.put("errorMessage", mapExceptionToI18n(e));
            return result;
        }
    }

    /**
     * Enfileira envio de mídia (PDF, imagem) para processamento assíncrono.
     */
    public Map<String, Object> enqueueMediaMessage(
            String phoneNumber,
            String caption,
            String mediaUrl,
            byte[] mediaBase64,
            String fileName,
            String mimeType) {
        Map<String, Object> result = new HashMap<>();
        result.put("success", false);

        long tenantId = tenantDataAccess.currentTenantId();
        if (!isTenantConfigured(tenantId)) {
            result.put("errorMessage", ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_TENANT_NOT_CONFIGURED));
            return result;
        }

        Map<String, Object> payload = new HashMap<>();
        payload.put("phoneNumber", phoneNumber);
        payload.put("caption", brandingFormatter.formatMediaCaption(caption));
        payload.put("fileName", fileName);
        payload.put("mimeType", mimeType != null ? mimeType : "application/pdf");
        if (mediaUrl != null && !mediaUrl.isBlank()) {
            payload.put("mediaUrl", mediaUrl);
        } else if (mediaBase64 != null && mediaBase64.length > 0) {
            payload.put("mediaBase64", java.util.Base64.getEncoder().encodeToString(mediaBase64));
        } else {
            result.put("errorMessage", ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_MEDIA_REQUIRED));
            return result;
        }

        messageJobService.enqueue(tenantId, com.aerosuite.domain.WhatsAppMessageJob.TYPE_SEND_MEDIA, payload);
        result.put("success", true);
        result.put("queued", true);
        return result;
    }

    /**
     * Envio síncrono de mídia — usado pelo worker em background.
     */
    public void sendMediaForTenant(
            long tenantId,
            String phoneNumber,
            String caption,
            String mediaUrl,
            String mediaBase64,
            String fileName,
            String mimeType) {
        TenantWhatsAppCredentials creds = resolveCredentials(tenantId);
        String cleanPhone = cleanPhoneNumber(phoneNumber);
        String resolvedMime = mimeType != null && !mimeType.isBlank() ? mimeType : "application/pdf";
        EvolutionMediaType mediaType = EvolutionMediaType.fromMimeType(resolvedMime);

        String brandedCaption = brandingFormatter.formatMediaCaption(caption);
        EvolutionSendMediaRequest request;
        if (mediaUrl != null && !mediaUrl.isBlank()) {
            request = EvolutionSendMediaRequest.fromUrl(
                    cleanPhone, mediaType, resolvedMime, mediaUrl, fileName, brandedCaption);
        } else if (mediaBase64 != null && !mediaBase64.isBlank()) {
            request = EvolutionSendMediaRequest.fromBase64(
                    cleanPhone, mediaType, resolvedMime, mediaBase64, fileName, brandedCaption);
        } else {
            throw new EvolutionApiException(ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_MEDIA_REQUIRED));
        }

        try {
            if (mediaType == EvolutionMediaType.DOCUMENT) {
                sendDocumentWithLogoHeader(creds, cleanPhone, caption, request);
            } else {
                httpClient.sendMedia(creds.instanceName(), creds.apiKey(), request);
            }
        } catch (EvolutionApiException e) {
            handleSendFailure(tenantId, e);
            throw e;
        }
    }

    public void sendTextForTenant(long tenantId, String phoneNumber, String message) {
        TenantWhatsAppCredentials creds = resolveCredentials(tenantId);
        try {
            sendBrandedText(creds, cleanPhoneNumber(phoneNumber), message);
        } catch (EvolutionApiException e) {
            handleSendFailure(tenantId, e);
            throw e;
        }
    }

    /**
     * Padrão WhatsApp Business: imagem {@code Aero_Claro.png} (ou logo do tenant) no topo
     * da mesma mensagem, corpo na legenda; fallback para texto se a logo não estiver disponível.
     */
    private void sendBrandedText(TenantWhatsAppCredentials creds, String cleanPhone, String message) {
        Optional<WhatsAppLogoAsset> logo = brandingFormatter.resolveLogoAsset();
        String body = brandingFormatter.formatMessageBody(message);
        if (logo.isPresent()) {
            WhatsAppLogoAsset asset = logo.get();
            httpClient.sendMedia(
                    creds.instanceName(),
                    creds.apiKey(),
                    EvolutionSendMediaRequest.fromBase64(
                            cleanPhone,
                            EvolutionMediaType.IMAGE,
                            asset.mimeType(),
                            asset.base64(),
                            asset.fileName(),
                            body));
            return;
        }
        httpClient.sendText(
                creds.instanceName(),
                creds.apiKey(),
                new EvolutionSendTextRequest(cleanPhone, brandingFormatter.formatFallbackPlainText(message)));
    }

    /**
     * PDF/documento: primeiro mensagem com logo no cabeçalho + corpo na legenda;
     * em seguida o arquivo, sem repetir o texto na legenda do anexo.
     */
    private void sendDocumentWithLogoHeader(
            TenantWhatsAppCredentials creds,
            String cleanPhone,
            String originalCaption,
            EvolutionSendMediaRequest documentRequest) {
        Optional<WhatsAppLogoAsset> logo = brandingFormatter.resolveLogoAsset();
        if (logo.isPresent()) {
            WhatsAppLogoAsset asset = logo.get();
            String bodyCaption = brandingFormatter.formatMessageBody(originalCaption);
            httpClient.sendMedia(
                    creds.instanceName(),
                    creds.apiKey(),
                    EvolutionSendMediaRequest.fromBase64(
                            cleanPhone,
                            EvolutionMediaType.IMAGE,
                            asset.mimeType(),
                            asset.base64(),
                            asset.fileName(),
                            bodyCaption));
            documentRequest.caption = brandingFormatter.formatDocumentAttachmentCaption(originalCaption);
            httpClient.sendMedia(creds.instanceName(), creds.apiKey(), documentRequest);
            return;
        }
        httpClient.sendMedia(creds.instanceName(), creds.apiKey(), documentRequest);
    }

    private void registerWebhook(String instanceName) {
        String webhookUrl = platformConfig.resolveWebhookUrl();
        if (webhookUrl.isBlank()) {
            LOG.warn("Evolution webhook URL não configurada — status será sincronizado via polling");
            return;
        }
        try {
            httpClient.setWebhook(instanceName, EvolutionSetWebhookRequest.connectionUpdates(webhookUrl));
        } catch (EvolutionApiException e) {
            LOG.warnf(e, "Falha ao registrar webhook Evolution para instância %s", instanceName);
        }
    }

    /**
     * Consulta {@code GET /instance/connectionState/{instance}} na Evolution e atualiza o tenant.
     */
    public void syncConnectionStateFromEvolution(long tenantId) {
        if (!platformConfig.isConfigured()) {
            return;
        }
        Optional<TenantWhatsAppConnection> connOpt = connectionService.findForTenant(tenantId);
        if (connOpt.isEmpty()) {
            return;
        }
        TenantWhatsAppConnection conn = connOpt.get();
        try {
            JsonNode response = httpClient.getConnectionState(conn.whatsappInstanceName);
            String state = extractEvolutionConnectionState(response);
            if (state == null) {
                return;
            }
            WhatsAppConnectionStatus mapped = WhatsAppConnectionStatus.fromEvolutionState(state);
            WhatsAppConnectionStatus current = conn.statusEnum();
            if (mapped != current && shouldApplySyncedStatus(current, mapped)) {
                connectionService.updateStatus(tenantId, mapped);
            }
        } catch (EvolutionApiException e) {
            if (e.getHttpStatus() != 404) {
                LOG.debugf(e, "Falha ao sincronizar status WhatsApp tenant %d", tenantId);
            }
        }
    }

    private static String extractEvolutionConnectionState(JsonNode response) {
        if (response == null) {
            return null;
        }
        if (response.hasNonNull("state")) {
            return response.get("state").asText();
        }
        if (response.has("instance") && response.get("instance").hasNonNull("state")) {
            return response.get("instance").get("state").asText();
        }
        if (response.has("connectionStatus") && response.get("connectionStatus").hasNonNull("state")) {
            return response.get("connectionStatus").get("state").asText();
        }
        return null;
    }

    private TenantWhatsAppConnection requireConnection(long tenantId) {
        return connectionService.findForTenant(tenantId)
                .orElseThrow(() -> new IllegalStateException(
                        ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_TENANT_NOT_CONFIGURED)));
    }

    private TenantWhatsAppCredentials resolveCredentials(long tenantId) {
        TenantWhatsAppConnection conn = requireConnection(tenantId);
        String token = connectionService.resolveInstanceToken(tenantId)
                .orElseThrow(() -> new IllegalStateException(
                        ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_TOKEN_UNAVAILABLE)));
        return new TenantWhatsAppCredentials(conn.whatsappInstanceName, token);
    }

    private void handleSendFailure(long tenantId, EvolutionApiException e) {
        if (e.isInstanceDisconnected()) {
            LOG.warnf("Instância WhatsApp desconectada (tenant %d): %s", tenantId, e.getMessage());
            connectionService.updateStatus(tenantId, WhatsAppConnectionStatus.DISCONNECTED);
        } else if (e.getHttpStatus() >= 500) {
            LOG.errorf(e, "Evolution API erro servidor (tenant %d)", tenantId);
        } else {
            LOG.warnf(e, "Evolution API erro envio (tenant %d)", tenantId);
        }
    }

    private void ensurePlatformReady() {
        if (!platformConfig.isPlatformEnabled()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_PLATFORM_DISABLED));
        }
        if (!platformConfig.isConfigured()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_PLATFORM_NOT_CONFIGURED));
        }
    }

    private static String mapExceptionToI18n(EvolutionApiException e) {
        if (e.getMessage() != null && e.getMessage().toLowerCase().contains("timeout")) {
            return ApiI18nMessages.encode(ApiI18nMessages.WHATSAPP_EVOLUTION_TIMEOUT);
        }
        if (e.isInstanceDisconnected()) {
            return ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_INSTANCE_DISCONNECTED);
        }
        return ApiI18nMessages.withDetail(ApiI18nMessages.WHATSAPP_EVOLUTION_SEND_FAILED, e.getMessage());
    }

    public static String cleanPhoneNumber(String phoneNumber) {
        if (phoneNumber == null) {
            return "";
        }
        String cleaned = phoneNumber.replaceAll("[^0-9]", "");
        if (cleaned.length() == 10 || cleaned.length() == 11) {
            cleaned = "55" + cleaned;
        }
        return cleaned;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }

    private static boolean isInstanceAlreadyInUse(EvolutionApiException e) {
        if (e.getHttpStatus() != 403) {
            return false;
        }
        String message = e.getMessage();
        return message != null && message.toLowerCase().contains("already in use");
    }

    /**
     * Evita rebaixar CONNECTED para CONNECTING quando a Evolution ainda reporta estado transitório
     * (comum após webhook ou enquanto o Baileys estabiliza a sessão).
     */
    static boolean shouldApplySyncedStatus(WhatsAppConnectionStatus current, WhatsAppConnectionStatus mapped) {
        if (current == mapped) {
            return false;
        }
        if (current == WhatsAppConnectionStatus.CONNECTED && mapped == WhatsAppConnectionStatus.CONNECTING) {
            return false;
        }
        return true;
    }

    private record TenantWhatsAppCredentials(String instanceName, String apiKey) {}
}
