package com.aerosuite.integration.bling;

import com.aerosuite.domain.BlingOAuthState;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.BlingNfeReadinessService;
import com.aerosuite.service.BlingWebhookService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.UUID;

@ApplicationScoped
public class BlingOAuthService {

    private static final int STATE_TTL_MINUTES = 15;

    @Inject
    BlingPlatformConfig platformConfig;

    @Inject
    TenantBlingConnectionService connectionService;

    @Inject
    BlingWebhookService blingWebhookService;

    @Inject
    BlingScopeProbe scopeProbe;

    @Inject
    BlingNfeReadinessService nfeReadinessService;

    @Transactional
    public BlingOAuthStartDto startAuthorization(long tenantId, int usuarioId) {
        if (!platformConfig.isPlatformEnabled()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_PLATFORM_DISABLED));
        }
        if (!platformConfig.isOAuthConfigured()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_OAUTH_NOT_CONFIGURED));
        }
        String state = UUID.randomUUID().toString().replace("-", "");
        BlingOAuthState row = new BlingOAuthState();
        row.stateToken = state;
        row.tenantId = tenantId;
        row.usuarioId = usuarioId;
        row.createdAt = LocalDateTime.now();
        row.expiresAt = LocalDateTime.now().plusMinutes(STATE_TTL_MINUTES);
        row.persist();

        String url = BlingPlatformConfig.AUTHORIZE_URL
                + "?response_type=code"
                + "&client_id=" + urlEncode(platformConfig.getClientId())
                + "&state=" + urlEncode(state);

        BlingOAuthStartDto dto = new BlingOAuthStartDto();
        dto.authorizationUrl = url;
        return dto;
    }

    @Transactional
    public void completeCallback(String code, String stateToken) {
        BlingOAuthState state = BlingOAuthState.findValid(stateToken);
        if (state == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BLING_OAUTH_STATE_INVALID));
        }
        if (code == null || code.isBlank()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BLING_OAUTH_CODE_MISSING));
        }
        TenantBlingConnectionService.BlingTokenExchangeResult tokens =
                connectionService.exchangeAuthorizationCode(code);
        String refresh = tokens.refreshToken;
        if (refresh == null || refresh.isBlank()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_NO_REFRESH_TOKEN));
        }
        connectionService.upsertTokens(
                state.tenantId,
                state.usuarioId,
                tokens.accessToken,
                refresh,
                tokens.expiresIn,
                null);
        blingWebhookService.refreshCompanyProfile(state.tenantId);
        scopeProbe.invalidate(state.tenantId);
        nfeReadinessService.invalidateTenant(state.tenantId);
        BlingOAuthState.deleteById(state.stateToken);
    }

    public String frontendSuccessUrl() {
        return platformConfig.getFrontendReturnUrl() + "?bling=connected";
    }

    public String frontendErrorUrl(String reason) {
        String base = platformConfig.getFrontendReturnUrl() + "?bling=error";
        if (reason != null && !reason.isBlank()) {
            return base + "&blingMessage=" + urlEncode(reason);
        }
        return base;
    }

    private static String urlEncode(String value) {
        return URLEncoder.encode(value, StandardCharsets.UTF_8);
    }
}
