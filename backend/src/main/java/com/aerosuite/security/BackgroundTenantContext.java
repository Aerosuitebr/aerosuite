package com.aerosuite.security;

import com.aerosuite.domain.TenantConstants;

/**
 * Tenant Hibernate em threads de fundo (backup, agendador) sem pedido HTTP ativo.
 */
public final class BackgroundTenantContext {

    private static final ThreadLocal<String> TENANT = new ThreadLocal<>();

    private BackgroundTenantContext() {}

    public static void runAs(long tenantId, Runnable action) {
        TENANT.set(String.valueOf(tenantId));
        try {
            action.run();
        } finally {
            TENANT.remove();
        }
    }

    public static String currentTenantId() {
        return TENANT.get();
    }

    public static void runAsDefault(Runnable action) {
        runAs(TenantConstants.DEFAULT_TENANT_ID, action);
    }
}
