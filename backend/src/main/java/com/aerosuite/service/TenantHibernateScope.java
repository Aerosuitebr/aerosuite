package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.dto.CreateTenantRequest;
import com.aerosuite.security.InternalUserContext;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * Transações independentes para provisão multi-tenant: a linha em {@code tenant} tem de
 * estar commitada antes de inserir {@code sistema_empresa_config} (FK) e o resolver Hibernate
 * deve ver o {@code tenantId} correto desde o início da transação de dados.
 */
@ApplicationScoped
public class TenantHibernateScope {

    @Inject
    InternalUserContext internalUserContext;

    /** Persiste e commita o registo {@code tenant} (tabela global, sem discriminador). */
    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public long createTenantRow(String codigo, String nome) {
        Tenant tenant = new Tenant();
        tenant.codigo = codigo;
        tenant.nome = nome;
        tenant.ativo = true;
        tenant.persist();
        return tenant.id;
    }

    @Transactional(Transactional.TxType.REQUIRES_NEW)
    public void runInNewTransaction(long tenantId, Runnable action) {
        internalUserContext.setProvisioningTenant(tenantId);
        try {
            action.run();
        } finally {
            internalUserContext.clearProvisioningTenant();
        }
    }
}
