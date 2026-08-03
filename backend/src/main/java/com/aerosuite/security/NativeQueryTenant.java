package com.aerosuite.security;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.Query;
import java.util.HashMap;
import java.util.Map;

/**
 * Parâmetro {@code :filterTid} para SQL nativo (Hibernate DISCRIMINATOR não aplica a queries cruas).
 */
@ApplicationScoped
public class NativeQueryTenant {

    @Inject
    TenantDataAccess tenantDataAccess;

    public long filterTid() {
        return tenantDataAccess.currentTenantId();
    }

    public Query bindFilterTid(Query query) {
        return query.setParameter("filterTid", filterTid());
    }

    public Map<String, Object> filterTidParam() {
        Map<String, Object> m = new HashMap<>();
        m.put("filterTid", filterTid());
        return m;
    }

    public void putFilterTid(Map<String, Object> params) {
        params.put("filterTid", filterTid());
    }

    public Query applyParams(Query query, Map<String, Object> params) {
        if (params != null) {
            params.forEach(query::setParameter);
        }
        return query;
    }

    /** Garante {@code :filterTid} no mapa e aplica todos os parâmetros à query. */
    public Query bindFilterTid(Query query, Map<String, Object> params) {
        if (params == null) {
            params = filterTidParam();
        } else {
            putFilterTid(params);
        }
        return applyParams(query, params);
    }
}
