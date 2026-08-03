package com.aerosuite.api;

import com.aerosuite.dto.PublicOnboardingFormDto;
import com.aerosuite.dto.PublicOnboardingSubmitRequest;
import com.aerosuite.service.PlatformOnboardingService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/public/onboarding")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class PublicOnboardingResource {

    @Inject
    PlatformOnboardingService onboardingService;

    @GET
    @Path("/{token}")
    public PublicOnboardingFormDto getForm(@PathParam("token") String token) {
        return onboardingService.getPublicForm(token);
    }

    @POST
    @Path("/{token}")
    public Response submit(@PathParam("token") String token, PublicOnboardingSubmitRequest request) {
        onboardingService.submitPublicForm(token, request);
        return Response.ok().build();
    }
}
