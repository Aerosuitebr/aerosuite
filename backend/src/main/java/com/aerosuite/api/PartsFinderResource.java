package com.aerosuite.api;

import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import com.aerosuite.parts.PartsFinderService;
import com.aerosuite.security.RequiresFuncionalidades;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;

@Path("/api/parts-finder")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyCodigoStartingWith = {"ESTOQUE", "PARTS_FINDER"})
public class PartsFinderResource {
    @Inject PartsFinderService service;

    @POST
    @Path("/search")
    public Response search(PartsFinderSearchRequest request) {
        var results = service.search(request);
        return Response.ok(Map.of("results", results, "total", results.size())).build();
    }
}
