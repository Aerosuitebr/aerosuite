package com.aerosuite.api;

import com.aerosuite.integration.bling.BlingOAuthService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.Response;
import java.net.URI;

/**
 * Callback OAuth Bling (público — validação via {@code state} CSRF).
 */
@Path("/api/integracoes/bling/oauth/callback")
public class BlingOAuthCallbackResource {

    @Inject
    BlingOAuthService blingOAuthService;

    @GET
    public Response callback(
            @QueryParam("code") String code,
            @QueryParam("state") String state,
            @QueryParam("error") String error,
            @QueryParam("error_description") String errorDescription) {
        if (error != null && !error.isBlank()) {
            String msg = errorDescription != null && !errorDescription.isBlank() ? errorDescription : error;
            return redirect(blingOAuthService.frontendErrorUrl(msg));
        }
        try {
            blingOAuthService.completeCallback(code, state);
            return redirect(blingOAuthService.frontendSuccessUrl());
        } catch (Exception e) {
            return redirect(blingOAuthService.frontendErrorUrl(e.getMessage()));
        }
    }

    private static Response redirect(String url) {
        return Response.temporaryRedirect(URI.create(url)).build();
    }
}
