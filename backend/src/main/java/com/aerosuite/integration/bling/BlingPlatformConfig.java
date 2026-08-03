package com.aerosuite.integration.bling;

import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class BlingPlatformConfig {

    public static final String AUTHORIZE_URL = "https://www.bling.com.br/Api/v3/oauth/authorize";
    public static final String TOKEN_URL = "https://www.bling.com.br/Api/v3/oauth/token";

    @ConfigProperty(name = "aero.suite.bling.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "aero.suite.bling.api-base-url", defaultValue = "https://api.bling.com.br/Api/v3")
    String apiBaseUrl;

    @ConfigProperty(name = "aero.suite.bling.access-token")
    java.util.Optional<String> legacyAccessToken;

    @ConfigProperty(name = "aero.suite.bling.oauth.client-id")
    java.util.Optional<String> clientId;

    @ConfigProperty(name = "aero.suite.bling.oauth.client-secret")
    java.util.Optional<String> clientSecret;

    @ConfigProperty(name = "aero.suite.bling.oauth.redirect-uri")
    java.util.Optional<String> redirectUri;

    @ConfigProperty(name = "frontend.url", defaultValue = "https://app.aerosuite.app")
    String frontendUrl;

    @ConfigProperty(name = "aero.suite.bling.oauth.frontend-return-path", defaultValue = "/configuracoes")
    String frontendReturnPath;

    public boolean isPlatformEnabled() {
        return enabled;
    }

    public boolean isOAuthConfigured() {
        return clientId.filter(s -> !s.isBlank()).isPresent()
                && clientSecret.filter(s -> !s.isBlank()).isPresent()
                && redirectUri.filter(s -> !s.isBlank()).isPresent();
    }

    public String getApiBaseUrl() {
        return apiBaseUrl;
    }

    public String getClientId() {
        return clientId.orElse("");
    }

    public String getClientSecret() {
        return clientSecret.orElse("");
    }

    public String getRedirectUri() {
        return redirectUri.orElse("");
    }

    public java.util.Optional<String> getLegacyAccessToken() {
        return legacyAccessToken.filter(t -> !t.isBlank());
    }

    public String getFrontendReturnUrl() {
        String base = frontendUrl.endsWith("/") ? frontendUrl.substring(0, frontendUrl.length() - 1) : frontendUrl;
        String path = frontendReturnPath.startsWith("/") ? frontendReturnPath : "/" + frontendReturnPath;
        return base + path;
    }
}
