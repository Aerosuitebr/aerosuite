package com.aerosuite.integration.bling;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import com.aerosuite.i18n.ApiI18nMessages;

@ApplicationScoped
public class BlingScopeProbe {

    private static final long CACHE_TTL_MS = 180_000L;

    private final ConcurrentHashMap<Long, CachedProbe> cache = new ConcurrentHashMap<>();

    @Inject
    BlingTenantApiClient tenantApiClient;

    public BlingScopesStatusDto probe(long tenantId) {
        return probe(tenantId, false);
    }

    public BlingScopesStatusDto probe(long tenantId, boolean refresh) {
        if (refresh) {
            cache.remove(tenantId);
        }
        long now = System.currentTimeMillis();
        CachedProbe cached = cache.get(tenantId);
        if (cached != null && now - cached.atMs < CACHE_TTL_MS) {
            return cached.dto;
        }
        BlingScopesStatusDto fresh = probeLive(tenantId);
        cache.put(tenantId, new CachedProbe(fresh, now));
        return fresh;
    }

    public void invalidate(long tenantId) {
        cache.remove(tenantId);
    }

    private BlingScopesStatusDto probeLive(long tenantId) {
        BlingScopesStatusDto out = new BlingScopesStatusDto();
        out.checks = new ArrayList<>();
        out.requiredBlingAppPermissions = BlingRequiredPermissions.panelChecklist();

        add(out, probeGet(tenantId, "contatos", "Contatos", "/contatos?pagina=1&limite=1",
                "Cadastros → Contatos → Gerenciar contatos"));
        add(out, probeGet(tenantId, "pedidos", "Pedidos de venda", "/pedidos/vendas?pagina=1&limite=1",
                "Vendas → Pedidos de venda → Gerenciar"));
        add(out, probeGet(tenantId, "produtos", "Produtos", "/produtos?pagina=1&limite=1",
                "Cadastros → Produtos → Gerenciar produtos"));
        add(out, probeGet(tenantId, "nfe", "NF-e", "/nfe?pagina=1&limite=1",
                "Notas fiscais → NF-e → Visualizar"));

        BlingScopeCheckDto empresa = probeGet(tenantId, "empresa", "Dados da empresa", "/empresas?limite=1",
                "Empresa → Dados básicos");
        if (empresa.httpStatus != null && empresa.httpStatus == 404) {
            empresa.ok = true;
            empresa.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_SCOPE_ENDPOINT_UNAVAILABLE);
        }
        add(out, empresa);

        out.allOk = out.checks.stream().allMatch(c -> c.ok);
        if (out.allOk) {
            out.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_SCOPE_ALL_OK);
        } else {
            long denied = out.checks.stream().filter(c -> !c.ok).count();
            out.message = ApiI18nMessages.encode(
                    ApiI18nMessages.BLING_SCOPE_PARTIAL_DENIED, "count", String.valueOf(denied));
        }
        return out;
    }

    private BlingScopeCheckDto probeGet(long tenantId, String resource, String label, String path, String permission) {
        BlingScopeCheckDto check = new BlingScopeCheckDto();
        check.resource = resource;
        check.label = label;
        check.blingAppPermission = permission;
        try {
            tenantApiClient.probeGet(tenantId, path);
            check.ok = true;
            check.httpStatus = 200;
            check.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_SCOPE_CHECK_OK);
        } catch (BlingTenantApiClient.BlingApiException e) {
            check.ok = false;
            check.httpStatus = e.httpStatus;
            if (e.httpStatus == 401) {
                check.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_SCOPE_RECONNECT_HINT);
            } else if (e.httpStatus == 403) {
                check.message = ApiI18nMessages.encode(
                        ApiI18nMessages.BLING_SCOPE_INSUFFICIENT, "permission", permission);
            } else if (e.httpStatus == 429) {
                check.ok = true;
                check.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_SCOPE_RATE_LIMIT);
            } else {
                check.message = ApiI18nMessages.withDetail(
                        ApiI18nMessages.BLING_HTTP_RESPONSE,
                        "HTTP " + e.httpStatus + (e.detail != null ? ": " + e.detail : ""));
            }
        } catch (Exception e) {
            check.ok = false;
            check.message = e.getMessage();
        }
        return check;
    }

    private static void add(BlingScopesStatusDto out, BlingScopeCheckDto check) {
        out.checks.add(check);
    }

    public Optional<BlingScopeCheckDto> firstFailure(BlingScopesStatusDto status) {
        if (status == null || status.checks == null) {
            return Optional.empty();
        }
        return status.checks.stream().filter(c -> !c.ok).findFirst();
    }

    private static final class CachedProbe {
        final BlingScopesStatusDto dto;
        final long atMs;

        CachedProbe(BlingScopesStatusDto dto, long atMs) {
            this.dto = dto;
            this.atMs = atMs;
        }
    }
}
