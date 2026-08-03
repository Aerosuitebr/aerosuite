package com.aerosuite.service;

import com.aerosuite.domain.Fabricante;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.Product;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.HomeDashboardMetricsDto;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

@ApplicationScoped
public class HomeDashboardService {

    @Inject
    TenantDataAccess tenantDataAccess;

    public HomeDashboardMetricsDto metrics() {
        long products = Product.count("isActive = true");
        long fabricantes = Fabricante.count("isActive = true");
        long ordensServico = OS.count("isActive = true");
        long usuarios = Usuario.count(
                "ativo = true and orgTenantId = ?1", tenantDataAccess.currentTenantId());
        return new HomeDashboardMetricsDto(products, fabricantes, ordensServico, usuarios);
    }
}
