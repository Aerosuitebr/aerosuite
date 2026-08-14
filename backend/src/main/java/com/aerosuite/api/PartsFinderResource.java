package com.aerosuite.api;

import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import com.aerosuite.dto.parts.PartsRfqRequest;
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
@RequiresFuncionalidades(anyOf = {"PARTS_FINDER_CONSULTAR"})
public class PartsFinderResource {
    @Inject PartsFinderService service;

    @POST
    @Path("/search")
    public Response search(PartsFinderSearchRequest request) {
        var results = service.search(request);
        return Response.ok(Map.of("results", results, "total", results.size())).build();
    }

    @POST
    @Path("/rfqs")
    public Response createRfq(PartsRfqRequest request) {
        return Response.status(Response.Status.CREATED).entity(service.createRfq(request)).build();
    }
}
