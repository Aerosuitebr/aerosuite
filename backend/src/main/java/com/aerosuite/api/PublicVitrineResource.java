package com.aerosuite.api;

import com.aerosuite.service.VitrineMediaService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.HeaderParam;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Set;

/**
 * Prévia pública da vitrine (login / visitantes). Apenas arquivos allowlisted.
 */
@Path("/api/public/vitrine")
public class PublicVitrineResource {

    private static final Set<String> PUBLIC_FILES = Set.of(
            "aerosuite-visao-geral-plataforma.mp4",
            "aerosuite-visao-geral-plataforma.jpg",
            "aerosuite-gestao-estoque-passo-a-passo.mp4",
            "aerosuite-gestao-estoque-passo-a-passo.jpg"
    );

    @Inject
    VitrineMediaService vitrineMediaService;

    @GET
    @Path("/media/{fileName}")
    @Produces(MediaType.WILDCARD)
    public Response streamPublicMedia(
            @PathParam("fileName") String fileName,
            @HeaderParam("Range") String rangeHeader) {
        if (!PUBLIC_FILES.contains(fileName)) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        java.nio.file.Path file = vitrineMediaService.resolveFile(fileName);
        if (file == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return vitrineMediaService.streamPublic(file, rangeHeader);
    }
}
