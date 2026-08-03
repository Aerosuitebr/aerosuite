package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.p1.TenantModuleCatalog;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;

@ApplicationScoped
public class TenantModuleService {

    public Set<String> enabledModules(Tenant tenant) {
        if (tenant == null) {
            return TenantModuleCatalog.parseModulos(null);
        }
        return TenantModuleCatalog.parseModulos(tenant.modulosHabilitados);
    }

    public Set<String> enabledModules(long tenantId) {
        Tenant t = Tenant.findById(tenantId);
        return enabledModules(t);
    }

    public List<String> enabledModulesList(long tenantId) {
        return new ArrayList<>(enabledModules(tenantId));
    }

    public boolean isFuncionalidadeAllowed(Tenant tenant, String funcionalidadeCodigo) {
        return TenantModuleCatalog.isFuncionalidadeAllowed(enabledModules(tenant), funcionalidadeCodigo);
    }

    public void applyModulos(Tenant tenant, List<String> modulos) {
        if (tenant == null) {
            return;
        }
        if (modulos == null || modulos.isEmpty()) {
            tenant.modulosHabilitados = TenantModuleCatalog.normalizeModulosList(null);
            return;
        }
        tenant.modulosHabilitados = TenantModuleCatalog.normalizeModulosList(modulos);
    }
}
