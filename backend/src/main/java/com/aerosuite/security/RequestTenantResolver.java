package com.aerosuite.security;

import com.aerosuite.domain.TenantConstants;
import io.quarkus.hibernate.orm.PersistenceUnitExtension;
import io.quarkus.hibernate.orm.runtime.tenant.TenantResolver;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.context.ContextNotActiveException;
import jakarta.inject.Inject;

/**
 * Tenant Hibernate (DISCRIMINATOR) a partir do JWT / {@link InternalUserContext}.
 * Pedidos sem autenticação usam o tenant {@code default} (id=1).
 */
@ApplicationScoped
@PersistenceUnitExtension
public class RequestTenantResolver implements TenantResolver {

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    AuthRequestAttributes authRequestAttributes;

    @Override
    public String getDefaultTenantId() {
        return String.valueOf(TenantConstants.DEFAULT_TENANT_ID);
    }

    @Override
    public String resolveTenantId() {
        String bgTid = BackgroundTenantContext.currentTenantId();
        if (bgTid != null && !bgTid.isBlank()) {
            return bgTid;
        }
        try {
            Long extTid = authRequestAttributes.getExternalOrgTenantId();
            if (extTid != null) {
                return String.valueOf(extTid);
            }
            Long tid = internalUserContext.getTenantId();
            return tid != null ? String.valueOf(tid) : getDefaultTenantId();
        } catch (ContextNotActiveException ex) {
            return getDefaultTenantId();
        }
    }
}
