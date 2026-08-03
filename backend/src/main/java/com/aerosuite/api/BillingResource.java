package com.aerosuite.api;

import com.aerosuite.dto.BillingCheckoutResponseDto;
import com.aerosuite.dto.BillingStatusDto;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.TenantBillingService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/billing")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class BillingResource {

    @Inject
    TenantBillingService tenantBillingService;
    @Inject
    InternalUserContext internalUserContext;

    @GET
    @Path("/status")
    public BillingStatusDto status() {
        return tenantBillingService.getStatus(requireTenantId());
    }

    @POST
    @Path("/checkout-session")
    public BillingCheckoutResponseDto checkout() {
        String email = internalUserContext.getEmail();
        return tenantBillingService.createCheckoutSession(requireTenantId(), email);
    }

    @POST
    @Path("/mock/activate")
    public BillingStatusDto mockActivate() {
        tenantBillingService.activateMockSubscription(requireTenantId());
        return tenantBillingService.getStatus(requireTenantId());
    }

    private long requireTenantId() {
        Long tid = internalUserContext.getTenantId();
        if (tid == null) {
            throw new BadRequestException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.TENANT_NOT_IDENTIFIED));
        }
        return tid;
    }
}
