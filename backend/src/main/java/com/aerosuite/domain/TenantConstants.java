package com.aerosuite.domain;

/**
 * Valores do tenant default (instalação single-tenant / migração inicial).
 * Novas linhas em {@code usuario} devem usar este id até existir fluxo de provisão multi-tenant.
 */
public final class TenantConstants {

    public static final long DEFAULT_TENANT_ID = 1L;
    /** Valor do {@link org.hibernate.annotations.TenantId} (Hibernate DISCRIMINATOR usa {@code String}). */
    public static final String DEFAULT_TENANT_ID_STR = "1";
    public static final String DEFAULT_CODIGO = "default";

    public static String tenantIdOf(long tenantId) {
        return String.valueOf(tenantId);
    }

    private TenantConstants() {}
}
