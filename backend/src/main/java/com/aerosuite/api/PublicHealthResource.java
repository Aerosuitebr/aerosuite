package com.aerosuite.api;

import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.time.Instant;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * Health check público — usado pelo indicador de status no rodapé (S4-24).
 */
@Path("/api/public/health")
@Produces(MediaType.APPLICATION_JSON)
public class PublicHealthResource {

    @Inject
    EntityManager entityManager;

    @GET
    public Response health() {
        Map<String, Object> body = new LinkedHashMap<>();
        boolean dbOk = false;
        try {
            Number n = (Number) entityManager.createNativeQuery("SELECT 1").getSingleResult();
            dbOk = n != null && n.intValue() == 1;
        } catch (Exception ignored) {
            dbOk = false;
        }
        body.put("ok", dbOk);
        body.put("checkedAt", Instant.now().toString());
        body.put("database", dbOk ? "UP" : "DOWN");
        Map<String, String> components = new LinkedHashMap<>();
        components.put("api", "UP");
        components.put("database", dbOk ? "UP" : "DOWN");
        body.put("components", components);
        return Response.status(dbOk ? Response.Status.OK : Response.Status.SERVICE_UNAVAILABLE).entity(body).build();
    }
}
