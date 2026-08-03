package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.BlingWebhookService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.UriInfo;

/**
 * P5.5 — endpoint público para webhooks Bling (validação HMAC).
 * URLs:
 * <ul>
 *   <li>{@code POST /api/integracoes/bling/webhook} — tenant via {@code companyId} no payload</li>
 *   <li>{@code POST /api/integracoes/bling/webhook/t/{tenantCodigo}} — tenant explícito</li>
 * </ul>
 */
@Path("/api/integracoes/bling/webhook")
public class BlingWebhookResource {

    @Inject
    BlingWebhookService blingWebhookService;

    @POST
    @Consumes(MediaType.WILDCARD)
    @Produces(MediaType.APPLICATION_JSON)
    public Response receber(
            String body,
            @HeaderParam("X-Bling-Signature-256") String signature,
            @Context UriInfo uriInfo) {
        return handle(body, signature, null);
    }

    @POST
    @Path("/t/{tenantCodigo}")
    @Consumes(MediaType.WILDCARD)
    @Produces(MediaType.APPLICATION_JSON)
    public Response receberPorTenant(
            @PathParam("tenantCodigo") String tenantCodigo,
            String body,
            @HeaderParam("X-Bling-Signature-256") String signature) {
        return handle(body, signature, tenantCodigo);
    }

    private Response handle(String body, String signature, String tenantCodigo) {
        if (body == null || body.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(ApiI18nMessages.encode(ApiI18nMessages.BLING_WEBHOOK_EMPTY_BODY))
                    .build();
        }
        blingWebhookService.receber(body, signature, tenantCodigo);
        return Response.ok().entity("{\"ok\":true}").build();
    }
}
