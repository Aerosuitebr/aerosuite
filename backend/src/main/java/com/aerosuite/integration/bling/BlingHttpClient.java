package com.aerosuite.integration.bling;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.List;
import java.util.Optional;

@ApplicationScoped
public class BlingHttpClient implements BlingClient {

    @Inject
    BlingPlatformConfig platformConfig;

    @Inject
    TenantBlingConnectionService tenantConnectionService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    BlingTenantApiClient tenantApiClient;

    @Inject
    BlingScopeProbe scopeProbe;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    @Override
    public BlingConnectionStatus checkConnection() {
        if (!platformConfig.isPlatformEnabled()) {
            return BlingConnectionStatus.disabled();
        }
        Long tenantId = internalUserContext.getTenantId();
        if (tenantId == null) {
            BlingConnectionStatus s = BlingConnectionStatus.notConfigured(platformConfig.isOAuthConfigured());
            s.message = ApiI18nMessages.encode(ApiI18nMessages.TENANT_NOT_IDENTIFIED);
            return s;
        }
        Optional<String> token = tenantConnectionService.resolveAccessToken(tenantId);
        if (token.isEmpty()) {
            return BlingConnectionStatus.notConfigured(platformConfig.isOAuthConfigured());
        }
        TenantBlingConnectionViewDto view = tenantConnectionService.getConnectionView(tenantId, false);
        BlingConnectionStatus status = new BlingConnectionStatus();
        status.enabled = true;
        status.configured = true;
        status.connected = view.connected || platformConfig.getLegacyAccessToken().isPresent();
        status.oauthConfigured = platformConfig.isOAuthConfigured();
        status.connectedAt = view.connectedAt;
        BlingScopesStatusDto scopes = scopeProbe.probe(tenantId);
        status.scopeChecks = scopes.checks;
        status.ok = scopes.allOk;
        status.message = scopes.message;
        if (!scopes.checks.isEmpty()) {
            status.httpStatus = scopes.checks.stream()
                    .filter(c -> c.httpStatus != null)
                    .mapToInt(c -> c.httpStatus)
                    .findFirst()
                    .orElse(scopes.allOk ? 200 : 403);
        }
        return status;
    }

    @Override
    public BlingContactPageDto searchContacts(String pesquisa, int limit) {
        BlingConnectionStatus conn = checkConnection();
        BlingContactPageDto page = new BlingContactPageDto();
        page.enabled = conn.enabled;
        page.configured = conn.configured;
        if (!conn.enabled || !conn.configured) {
            page.message = conn.message;
            page.items = List.of();
            return page;
        }
        Long tenantId = internalUserContext.getTenantId();
        Optional<String> tokenOpt = tenantId != null
                ? tenantConnectionService.resolveAccessToken(tenantId)
                : Optional.empty();
        if (tokenOpt.isEmpty()) {
            page.message = conn.message;
            page.items = List.of();
            return page;
        }
        int lim = Math.min(Math.max(limit, 1), 50);
        try {
            String base = normalizeBase(platformConfig.getApiBaseUrl());
            String q = pesquisa != null && !pesquisa.isBlank()
                    ? URLEncoder.encode(pesquisa.trim(), StandardCharsets.UTF_8)
                    : "";
            String path = base + "/contatos?pagina=1&limite=" + lim;
            if (!q.isEmpty()) {
                path += "&pesquisa=" + q;
            }
            HttpRequest req = HttpRequest.newBuilder(URI.create(path))
                    .timeout(Duration.ofSeconds(20))
                    .header("Authorization", "Bearer " + tokenOpt.get())
                    .header("Accept", "application/json")
                    .header("enable-jwt", "1")
                    .GET()
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                page.message = ApiI18nMessages.withDetail(
                        ApiI18nMessages.BLING_HTTP_RESPONSE, "HTTP " + res.statusCode());
                page.items = List.of();
                return page;
            }
            page.items = BlingContactsJsonParser.parse(res.body());
            page.message = page.items.isEmpty()
                    ? ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACTS_NOT_FOUND)
                    : null;
            return page;
        } catch (Exception e) {
            page.message = ApiI18nMessages.withDetail(ApiI18nMessages.BLING_SEARCH_CONTACTS_FAILED, e.getMessage());
            page.items = List.of();
            return page;
        }
    }

    @Override
    public BlingContactDto getContactById(long blingContatoId) {
        Long tenantId = internalUserContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_NOT_IDENTIFIED));
        }
        return tenantApiClient.fetchContact(tenantId, blingContatoId);
    }

    @Override
    public BlingCompanyInfoDto fetchCompanyInfo() {
        Long tenantId = internalUserContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_NOT_IDENTIFIED));
        }
        return tenantApiClient.fetchCompanyInfo(tenantId);
    }

    private static String normalizeBase(String apiBaseUrl) {
        return apiBaseUrl.endsWith("/") ? apiBaseUrl.substring(0, apiBaseUrl.length() - 1) : apiBaseUrl;
    }
}
