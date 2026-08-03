package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.PlatformOnboardingService;
import com.aerosuite.service.TenantProvisioningService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.List;
import java.util.Map;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

/**
 * Provisão e gestão de organizações (SaaS). Restrito ao tenant default (operador da plataforma).
 */
@Path("/api/tenants")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"GERENCIAR_PERMISSOES"})
public class TenantResource {

    @Inject
    TenantProvisioningService tenantProvisioningService;

    @Inject
    PlatformOnboardingService onboardingService;

    @GET
    public TenantListResponse list() {
        return tenantProvisioningService.listTenantsWithSummary();
    }

    @GET
    @Path("/check-codigo")
    public CodigoAvailabilityDto checkCodigo(@QueryParam("codigo") String codigo) {
        return tenantProvisioningService.checkCodigoAvailability(codigo);
    }

    @GET
    @Path("/{id}")
    public TenantDetailDto getDetail(@PathParam("id") long id) {
        return tenantProvisioningService.getTenantDetail(id);
    }

    @POST
    public Response create(CreateTenantRequest request) {
        ProvisionTenantResponse response = tenantProvisioningService.provision(request);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }

    @PUT
    @Path("/{id}")
    public TenantSummaryDto update(@PathParam("id") long id, UpdateTenantRequest request) {
        return tenantProvisioningService.updateTenant(id, request);
    }

    @GET
    @Path("/{id}/features")
    public TenantFeaturesAdminDto getFeatures(@PathParam("id") long id) {
        return tenantProvisioningService.getTenantFeatures(id);
    }

    @PUT
    @Path("/{id}/features")
    public TenantFeaturesAdminDto updateFeatures(
            @PathParam("id") long id, UpdateTenantFeaturesRequest request) {
        return tenantProvisioningService.updateTenantFeatures(id, request);
    }

    @POST
    @Path("/{id}/welcome-email")
    public WelcomeEmailResponse resendWelcome(@PathParam("id") long id, WelcomeEmailRequest request) {
        return tenantProvisioningService.resendWelcomeEmail(id, request);
    }

    @GET
    @Path("/{id}/onboarding-link")
    public java.util.Map<String, String> onboardingLink(@PathParam("id") long id) {
        return java.util.Map.of("publicFormUrl", onboardingService.getPublicFormUrlForTenant(id));
    }

    @POST
    @Path("/{id}/logo")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    public Response uploadLogo(@PathParam("id") long id, @RestForm("file") FileUpload file) {
        tenantProvisioningService.uploadTenantLogo(id, file);
        com.aerosuite.domain.Tenant t = com.aerosuite.domain.Tenant.findById(id);
        String logoUrl = com.aerosuite.service.EmpresaAssetService.publicLogoUrlForTenantCodigo(
                t != null ? t.codigo : null);
        return Response.ok(Map.of("logoUrl", logoUrl)).build();
    }
}
