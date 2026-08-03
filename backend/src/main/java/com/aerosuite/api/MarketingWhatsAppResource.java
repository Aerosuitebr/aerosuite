package com.aerosuite.api;

import com.aerosuite.service.MarketingWhatsAppSessionService;
import com.aerosuite.service.MarketingWhatsAppSessionService.ContactRequest;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

/**
 * Contato público por sessão efêmera. O destino e o conteúdo final são
 * controlados pelo servidor para impedir uso como relay de spam.
 */
@Path("/api/public/onboarding/marketing-whatsapp/session")
public class MarketingWhatsAppResource {

    @Inject
    MarketingWhatsAppSessionService service;

    @GET
    public Response status(@QueryParam("sessionKey") String sessionKey) {
        return execute(() -> service.status(sessionKey));
    }

    @POST
    public Response start(SessionRequest request) {
        return execute(() -> service.start(request != null ? request.sessionKey : null));
    }

    @PUT
    public Response send(SendRequest request) {
        return execute(() -> service.sendAndDisconnect(
                request != null ? request.sessionKey : null,
                request != null
                        ? new ContactRequest(request.name, request.company, request.interest)
                        : null));
    }

    @DELETE
    public Response disconnect(@QueryParam("sessionKey") String sessionKey) {
        return execute(() -> Map.of("ok", service.disconnect(sessionKey)));
    }

    private Response execute(Action action) {
        try {
            return Response.ok(action.run(), MediaType.APPLICATION_JSON).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(Map.of("error", e.getMessage()))
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.BAD_GATEWAY)
                    .entity(Map.of("error", "Falha ao comunicar com o WhatsApp."))
                    .type(MediaType.APPLICATION_JSON)
                    .build();
        }
    }

    @FunctionalInterface
    private interface Action {
        Object run();
    }

    public static class SessionRequest {
        public String sessionKey;
    }

    public static class SendRequest {
        public String sessionKey;
        public String name;
        public String company;
        public String interest;
    }
}
