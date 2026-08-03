package com.aerosuite.api;

import com.aerosuite.dto.ProvisionTenantResponse;
import com.aerosuite.dto.TrialSignupRequest;
import com.aerosuite.service.TenantSignupService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.container.ContainerRequestContext;

@Path("/api/public/signup")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PublicSignupResource {

    @Inject
    TenantSignupService tenantSignupService;

    @POST
    @Path("/trial")
    public Response trial(TrialSignupRequest request, @Context ContainerRequestContext ctx) {
        String ip = ctx.getHeaderString("X-Forwarded-For");
        if (ip == null) {
            ip = ctx.getHeaderString("X-Real-IP");
        }
        String ua = ctx.getHeaderString("User-Agent");
        ProvisionTenantResponse response = tenantSignupService.signupTrial(request, ip, ua);
        return Response.status(Response.Status.CREATED).entity(response).build();
    }
}
