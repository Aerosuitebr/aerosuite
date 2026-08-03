package com.aerosuite.api;

import com.aerosuite.dto.TenantFeaturesDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.TenantFeatureService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;

/**
 * Feature flags do tenant do utilizador autenticado (login / refresh de sessão).
 */
@Path("/api/tenant/features")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class TenantFeatureResource {

    @Inject
    TenantFeatureService tenantFeatureService;

    @GET
    public TenantFeaturesDto listEnabled() {
        return tenantFeatureService.featuresForCurrentUser();
    }
}
