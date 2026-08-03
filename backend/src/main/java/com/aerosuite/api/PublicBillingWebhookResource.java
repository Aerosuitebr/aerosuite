package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.TenantBillingService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.container.ContainerRequestContext;

import java.util.Map;

@Path("/api/billing/webhooks")
@Produces(MediaType.APPLICATION_JSON)
public class PublicBillingWebhookResource {

    @Inject
    TenantBillingService tenantBillingService;

    @POST
    @Path("/stripe")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response stripe(String body, @Context ContainerRequestContext ctx) {
        String sig = ctx.getHeaderString("Stripe-Signature");
        if (sig == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_SIGNATURE_REQUIRED)))
                    .build();
        }
        tenantBillingService.handleBillingWebhook(body, sig);
        return Response.ok(Map.of("received", true)).build();
    }

    @POST
    @Path("/pagarme")
    @Consumes(MediaType.APPLICATION_JSON)
    public Response pagarme(String body, @Context ContainerRequestContext ctx) {
        String sig = firstHeader(ctx, "X-Hub-Signature-256", "X-Hub-Signature");
        if (sig == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.BILLING_PAGARME_SIGNATURE_REQUIRED)))
                    .build();
        }
        tenantBillingService.handleBillingWebhook(body, sig);
        return Response.ok(Map.of("received", true)).build();
    }

    private static String firstHeader(ContainerRequestContext ctx, String... names) {
        for (String name : names) {
            String value = ctx.getHeaderString(name);
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }
}
