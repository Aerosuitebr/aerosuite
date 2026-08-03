package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.UserDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.ArrayList;

@ApplicationScoped
public class P1UserEnrichmentService {

    @Inject
    TenantModuleService tenantModuleService;
    @Inject
    LgpdService lgpdService;
    @Inject
    TenantBillingService tenantBillingService;
    @Inject
    TenantFeatureService tenantFeatureService;

    public void enrich(UserDto dto, Usuario usuario) {
        if (dto == null || usuario == null || usuario.orgTenantId == null) {
            return;
        }
        Tenant tenant = Tenant.findById(usuario.orgTenantId);
        enrich(dto, usuario, tenant);
    }

    /** Uma única leitura de {@link Tenant} por pedido (login / {@code GET /auth/me}). */
    public void enrich(UserDto dto, Usuario usuario, Tenant tenant) {
        if (dto == null || usuario == null || usuario.orgTenantId == null) {
            return;
        }
        dto.modulosHabilitados = new ArrayList<>(tenantModuleService.enabledModules(tenant));
        dto.tenantFeatures = tenantFeatureService.featuresForTenant(usuario.orgTenantId).enabled;
        dto.lgpdAceitePendente = lgpdService.needsConsent(usuario.id);
        dto.billingStatus = tenantBillingService.getStatus(usuario.orgTenantId).status;
    }
}
