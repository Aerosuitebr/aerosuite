package com.aerosuite.api;

import com.aerosuite.service.EvolutionWebhookService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

/**
 * Endpoint público para webhooks da Evolution API v2.
 * Registrar em cada instância: eventos {@code CONNECTION_UPDATE} e {@code QRCODE_UPDATED}.
 */
@Path("/webhooks/evolution")
public class EvolutionWebhookResource {

    @Inject
    EvolutionWebhookService webhookService;

    @POST
    @Consumes(MediaType.WILDCARD)
    @Produces(MediaType.APPLICATION_JSON)
    public Response receber(String body) {
        webhookService.receber(body);
        return Response.ok().entity("{\"ok\":true}").build();
    }
}
