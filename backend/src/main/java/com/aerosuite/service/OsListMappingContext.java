package com.aerosuite.service;

import jakarta.enterprise.context.ApplicationScoped;

/**
 * Evita N+1 no {@link com.aerosuite.mapping.OSMapper} durante GET /os (listagem):
 * FCU e fabricante são enriquecidos em lote no {@link OSService}.
 */
@ApplicationScoped
public class OsListMappingContext {

    private static final ThreadLocal<Boolean> LIST_BATCH = ThreadLocal.withInitial(() -> false);

    public void beginListBatch() {
        LIST_BATCH.set(true);
    }

    public void endListBatch() {
        LIST_BATCH.remove();
    }

    public boolean skipRelationFetches() {
        return Boolean.TRUE.equals(LIST_BATCH.get());
    }
}
