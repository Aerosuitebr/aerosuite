package com.aerosuite.integration.bling;

import com.aerosuite.i18n.ApiI18nMessages;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.Base64;
import java.util.Optional;
import java.util.logging.Logger;
import com.aerosuite.domain.TenantBlingConnection;
import com.aerosuite.security.SecretCipher;

@ApplicationScoped
public class TenantBlingConnectionService {

    private static final Logger LOGGER = Logger.getLogger(TenantBlingConnectionService.class.getName());
    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    BlingPlatformConfig platformConfig;

    @Inject
    SecretCipher secretCipher;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(15))
            .build();

    public TenantBlingConnectionViewDto getConnectionView(long tenantId, boolean canManage) {
        TenantBlingConnectionViewDto dto = new TenantBlingConnectionViewDto();
        dto.platformEnabled = platformConfig.isPlatformEnabled();
        dto.oauthConfigured = platformConfig.isOAuthConfigured();
        dto.canManage = canManage;
        if (!dto.platformEnabled) {
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_STATUS_PLATFORM_DISABLED);
            return dto;
        }
        TenantBlingConnection conn = TenantBlingConnection.findForTenant(tenantId);
        dto.linked = conn != null;
        TokenHealth health = assessTokenHealth(tenantId, conn);
        dto.tokenOperational = health.operational;
        dto.tokenIssue = health.issueCode;
        dto.connected = dto.linked && dto.tokenOperational;
        if (conn != null) {
            dto.connectedAt = conn.connectedAt != null ? conn.connectedAt.toString() : null;
            dto.blingCompanyName = conn.blingCompanyName;
            dto.blingCompanyId = conn.blingCompanyId;
            if (dto.tokenOperational) {
                dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_STATUS_ACCOUNT_CONNECTED);
            } else {
                dto.message = health.userMessage;
            }
        } else if (platformConfig.getLegacyAccessToken().isPresent()) {
            dto.tokenOperational = true;
            dto.connected = true;
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_STATUS_LEGACY_TOKEN);
        } else if (!dto.oauthConfigured) {
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_STATUS_OAUTH_NOT_CONFIGURED);
        } else {
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_STATUS_NO_ACCOUNT);
        }
        return dto;
    }

    public boolean isTokenOperational(long tenantId) {
        if (!platformConfig.isPlatformEnabled()) {
            return false;
        }
        TenantBlingConnection conn = TenantBlingConnection.findForTenant(tenantId);
        if (conn != null) {
            return assessTokenHealth(tenantId, conn).operational;
        }
        return platformConfig.getLegacyAccessToken().isPresent();
    }

    private TokenHealth assessTokenHealth(long tenantId, TenantBlingConnection conn) {
        if (conn == null) {
            return TokenHealth.inoperational("NO_LINK", ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_NOT_CONNECTED));
        }
        try {
            if (resolveAccessToken(tenantId).isPresent()) {
                return TokenHealth.ok();
            }
            return TokenHealth.inoperational(
                    "NO_TOKEN",
                    ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_RECONNECT_OAUTH));
        } catch (IllegalStateException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "";
            if (isInvalidRefreshToken(e)) {
                return TokenHealth.inoperational(
                        "EXPIRED",
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_TOKEN_REVOKED));
            }
            if (msg.contains("SECRET_DECRYPT") || msg.contains("decrypt") || msg.contains("SECRET_DECRYPT_FAILED")) {
                return TokenHealth.inoperational(
                        "DECRYPT_ERROR",
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_RECONNECT_OAUTH));
            }
            LOGGER.warning("Token Bling inoperante tenant " + tenantId + ": " + msg);
            return TokenHealth.inoperational(
                    "TOKEN_ERROR",
                    ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_RECONNECT_OAUTH));
        }
    }

    private record TokenHealth(boolean operational, String issueCode, String userMessage) {
        static TokenHealth ok() {
            return new TokenHealth(true, null, null);
        }

        static TokenHealth inoperational(String code, String message) {
            return new TokenHealth(false, code, message);
        }
    }

    public boolean hasTenantConnection(long tenantId) {
        return TenantBlingConnection.findForTenant(tenantId) != null;
    }

    /**
     * Token de acesso válido: conexão OAuth do tenant ou fallback legado global.
     */
    public Optional<String> resolveAccessToken(long tenantId) {
        if (!platformConfig.isPlatformEnabled()) {
            return Optional.empty();
        }
        TenantBlingConnection conn = TenantBlingConnection.findForTenant(tenantId);
        if (conn != null) {
            try {
                return Optional.of(getOrRefreshAccessToken(conn));
            } catch (IllegalStateException e) {
                if (isInvalidRefreshToken(e)) {
                    LOGGER.warning("Refresh token Bling inválido para tenant " + tenantId + "; desconectando conta.");
                    disconnect(tenantId);
                    return Optional.empty();
                }
                throw e;
            }
        }
        return platformConfig.getLegacyAccessToken();
    }

    private static boolean isInvalidRefreshToken(IllegalStateException e) {
        String msg = e.getMessage();
        return msg != null && (msg.contains("invalid_grant") || msg.contains("Invalid refresh token"));
    }

    @Transactional
    public void disconnect(long tenantId) {
        TenantBlingConnection.delete("tenantId", tenantId);
    }

    @Transactional
    public void upsertTokens(
            long tenantId,
            int usuarioId,
            String accessToken,
            String refreshToken,
            int expiresInSeconds,
            String blingCompanyName) {
        LocalDateTime expiresAt = LocalDateTime.now().plusSeconds(Math.max(expiresInSeconds, 60));
        TenantBlingConnection conn = TenantBlingConnection.findForTenant(tenantId);
        if (conn == null) {
            conn = new TenantBlingConnection();
            conn.tenantId = tenantId;
            conn.connectedAt = LocalDateTime.now();
            conn.connectedByUsuarioId = usuarioId;
        }
        conn.accessTokenEnc = secretCipher.encrypt(accessToken);
        conn.refreshTokenEnc = secretCipher.encrypt(refreshToken);
        conn.tokenExpiresAt = expiresAt;
        conn.blingCompanyName = blingCompanyName;
        if (conn.isPersistent()) {
            conn.flush();
        } else {
            conn.persist();
        }
    }

    BlingTokenExchangeResult exchangeAuthorizationCode(String code) {
        String body = "grant_type=authorization_code"
                + "&code=" + urlEncode(code.trim())
                + "&redirect_uri=" + urlEncode(platformConfig.getRedirectUri());
        return postToken(body);
    }

    private String getOrRefreshAccessToken(TenantBlingConnection conn) {
        if (conn.tokenExpiresAt != null
                && conn.tokenExpiresAt.isAfter(LocalDateTime.now().plusMinutes(3))) {
            return secretCipher.decrypt(conn.accessTokenEnc);
        }
        return refreshAndPersist(conn);
    }

    @Transactional
    String refreshAndPersist(TenantBlingConnection conn) {
        String refreshToken = secretCipher.decrypt(conn.refreshTokenEnc);
        BlingTokenExchangeResult result = postToken(
                "grant_type=refresh_token&refresh_token=" + urlEncode(refreshToken));
        conn.accessTokenEnc = secretCipher.encrypt(result.accessToken);
        if (result.refreshToken != null && !result.refreshToken.isBlank()) {
            conn.refreshTokenEnc = secretCipher.encrypt(result.refreshToken);
        }
        conn.tokenExpiresAt = LocalDateTime.now().plusSeconds(Math.max(result.expiresIn, 60));
        conn.flush();
        LOGGER.info("Token Bling renovado para tenant " + conn.tenantId);
        return result.accessToken;
    }

    private BlingTokenExchangeResult postToken(String formBody) {
        if (!platformConfig.isOAuthConfigured()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_OAUTH_NOT_CONFIGURED));
        }
        try {
            String basic = Base64.getEncoder().encodeToString(
                    (platformConfig.getClientId() + ":" + platformConfig.getClientSecret())
                            .getBytes(StandardCharsets.UTF_8));
            HttpRequest req = HttpRequest.newBuilder(URI.create(BlingPlatformConfig.TOKEN_URL))
                    .timeout(Duration.ofSeconds(30))
                    .header("Authorization", "Basic " + basic)
                    .header("Content-Type", "application/x-www-form-urlencoded")
                    .header("Accept", "application/json")
                    .header("enable-jwt", "1")
                    .POST(HttpRequest.BodyPublishers.ofString(formBody))
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                throw new IllegalStateException(
                        "Bling OAuth token HTTP " + res.statusCode() + ": " + truncate(res.body(), 300));
            }
            JsonNode root = MAPPER.readTree(res.body());
            BlingTokenExchangeResult out = new BlingTokenExchangeResult();
            out.accessToken = text(root, "access_token");
            out.refreshToken = text(root, "refresh_token");
            out.expiresIn = root.path("expires_in").asInt(3600);
            if (out.accessToken == null || out.accessToken.isBlank()) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_OAUTH_NO_ACCESS_TOKEN));
            }
            return out;
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_OAUTH_TOKEN_FAILED, e.getMessage()), e);
        }
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        return v != null && !v.isNull() ? v.asText() : null;
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    static final class BlingTokenExchangeResult {
        String accessToken;
        String refreshToken;
        int expiresIn;
    }
}
