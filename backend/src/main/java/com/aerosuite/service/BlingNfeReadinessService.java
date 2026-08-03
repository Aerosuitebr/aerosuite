package com.aerosuite.service;

import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.aerosuite.integration.bling.BlingNfeReadinessCheckDto;
import com.aerosuite.integration.bling.BlingNfeReadinessDto;
import com.aerosuite.integration.bling.BlingScopeCheckDto;
import com.aerosuite.integration.bling.BlingScopeProbe;
import com.aerosuite.integration.bling.BlingScopesStatusDto;
import com.aerosuite.integration.bling.TenantBlingConnectionService;
import com.aerosuite.integration.bling.TenantBlingConnectionViewDto;
import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.ConcurrentHashMap;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/** Validação prévia do pipeline NF-e (tenant). */
@ApplicationScoped
public class BlingNfeReadinessService {

    @ConfigProperty(name = "aero.suite.bling.nfe-readiness.tenant-cache-ttl-sec", defaultValue = "300")
    long tenantCacheTtlSec;

    private final ConcurrentHashMap<String, CachedReadiness> cache = new ConcurrentHashMap<>();

    @Inject
    TenantBlingConnectionService tenantConnectionService;

    @Inject
    TenantBlingFiscalConfigService fiscalConfigService;

    @Inject
    BlingScopeProbe scopeProbe;

    public BlingNfeReadinessDto evaluateTenant(long tenantId) {
        return evaluateTenant(tenantId, false);
    }

    public BlingNfeReadinessDto evaluateTenant(long tenantId, boolean refresh) {
        if (refresh) {
            invalidateTenant(tenantId);
        }
        String key = tenantId + ":tenant";
        if (!refresh) {
            BlingNfeReadinessDto cached = getCached(key, tenantCacheTtlSec * 1000L);
            if (cached != null) {
                return cached;
            }
        }
        BlingNfeReadinessDto out = evaluateTenantLive(tenantId);
        putCache(key, out);
        return out;
    }

    public void invalidateTenant(long tenantId) {
        cache.keySet().removeIf(k -> k.startsWith(tenantId + ":"));
    }

    private BlingNfeReadinessDto evaluateTenantLive(long tenantId) {
        BlingNfeReadinessDto out = new BlingNfeReadinessDto();
        TenantBlingConnectionViewDto conn = tenantConnectionService.getConnectionView(tenantId, false);
        addCheck(
                out,
                check(
                        "oauth",
                        "Conta Bling conectada",
                        conn.tokenOperational && conn.linked,
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_RECONNECT_OAUTH),
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_NOT_CONNECTED)));
        TenantBlingFiscalConfig fiscal = fiscalConfigService.resolveEffective(tenantId);
        addCheck(
                out,
                check(
                        "cert_local",
                        "Certificado digital",
                        fiscal.hasCertificado(),
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_UPLOAD_CERT),
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_CERT_MISSING)));
        addCheck(
                out,
                check(
                        "cfop",
                        "CFOP padrão",
                        fiscal.cfopPadrao != null && !fiscal.cfopPadrao.isBlank(),
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_FILL_CFOP),
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_CFOP_MISSING)));
        addCheck(
                out,
                check(
                        "ncm",
                        "NCM padrão",
                        fiscal.ncmPadrao != null && !fiscal.ncmPadrao.isBlank(),
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_FILL_NCM),
                        ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_NCM_MISSING)));
        if (conn.tokenOperational && conn.linked) {
            BlingScopesStatusDto scopes = scopeProbe.probe(tenantId);
            for (BlingScopeCheckDto sc : scopes.checks) {
                addCheck(out, scopeReadinessCheck(sc));
            }
        }
        out.ready = out.blockers.isEmpty();
        out.message = out.ready
                ? ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_READY)
                : String.join("; ", out.blockers);
        return out;
    }

    private static BlingNfeReadinessCheckDto scopeReadinessCheck(BlingScopeCheckDto sc) {
        String fixHint = sc.blingAppPermission != null && !sc.blingAppPermission.isBlank()
                ? ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_SCOPE_FIX, "permission", sc.blingAppPermission)
                : ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_SCOPE_RECONNECT);
        String failMessage = scopeFailMessage(sc);
        return check("scope_" + sc.resource, sc.label, sc.ok, fixHint, failMessage);
    }

    private static String scopeFailMessage(BlingScopeCheckDto sc) {
        if (sc.httpStatus != null && sc.httpStatus == 401) {
            return ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_TOKEN_REVOKED);
        }
        if (sc.httpStatus != null && sc.httpStatus == 403) {
            return ApiI18nMessages.encode(ApiI18nMessages.BLING_READINESS_SCOPE_FORBIDDEN);
        }
        return sc.label + " indisponível.";
    }

    private static BlingNfeReadinessCheckDto check(
            String code, String label, boolean ok, String fixHint, String failMessage) {
        BlingNfeReadinessCheckDto c = new BlingNfeReadinessCheckDto();
        c.code = code;
        c.label = label;
        c.ok = ok;
        c.blocking = true;
        c.fixHint = fixHint;
        c.message = ok ? "OK" : failMessage;
        return c;
    }

    private static void addCheck(BlingNfeReadinessDto out, BlingNfeReadinessCheckDto check) {
        out.checks.add(check);
        if (!check.ok && check.blocking) {
            String line = check.message;
            if (check.fixHint != null && !check.fixHint.isBlank()) {
                line = line + " " + check.fixHint;
            }
            out.blockers.add(line);
        }
    }

    private BlingNfeReadinessDto getCached(String key, long ttlMs) {
        CachedReadiness row = cache.get(key);
        if (row == null) {
            return null;
        }
        if (System.currentTimeMillis() - row.atMs > ttlMs) {
            cache.remove(key, row);
            return null;
        }
        return copyDto(row.dto);
    }

    private void putCache(String key, BlingNfeReadinessDto dto) {
        if (dto == null) {
            return;
        }
        cache.put(key, new CachedReadiness(copyDto(dto), System.currentTimeMillis()));
    }

    private static BlingNfeReadinessDto copyDto(BlingNfeReadinessDto src) {
        BlingNfeReadinessDto out = new BlingNfeReadinessDto();
        out.ready = src.ready;
        out.message = src.message;
        out.checks = new ArrayList<>(src.checks);
        out.blockers = new ArrayList<>(src.blockers);
        out.warnings = new ArrayList<>(src.warnings);
        return out;
    }

    private static final class CachedReadiness {
        final BlingNfeReadinessDto dto;
        final long atMs;

        CachedReadiness(BlingNfeReadinessDto dto, long atMs) {
            this.dto = dto;
            this.atMs = atMs;
        }
    }
}
