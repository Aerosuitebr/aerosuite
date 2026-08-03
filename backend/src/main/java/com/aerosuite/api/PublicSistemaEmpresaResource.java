package com.aerosuite.api;

import com.aerosuite.dto.sistema.SistemaEmpresaPublicBrandingDto;
import com.aerosuite.service.SistemaEmpresaConfigService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Endpoints públicos relacionados à marca da empresa (sem JWT).
 */
@Path("/api/public/sistema-empresa")
@Produces(MediaType.APPLICATION_JSON)
public class PublicSistemaEmpresaResource {

    @Inject
    SistemaEmpresaConfigService sistemaEmpresaConfigService;

    @GET
    @Path("/branding")
    public Response branding(@QueryParam("tenant") String tenantCodigo) {
        SistemaEmpresaPublicBrandingDto dto = tenantCodigo != null && !tenantCodigo.isBlank()
                ? sistemaEmpresaConfigService.publicBrandingForTenantCodigo(tenantCodigo)
                : sistemaEmpresaConfigService.publicBranding();
        return Response.ok(dto).build();
    }
}
