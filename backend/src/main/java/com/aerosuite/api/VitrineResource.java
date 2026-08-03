package com.aerosuite.api;

import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.VitrineMediaService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.nio.file.Path;

/**
 * Mídia da vitrine de vídeos (pasta na raiz do repositório, configurável).
 * GET /api/vitrine/media/{fileName} — streaming com suporte a Range (HTML5 video).
 */
@jakarta.ws.rs.Path("/api/vitrine")
@RequiresFuncionalidades(anyCodigoStartingWith = {"VITRINE"})
public class VitrineResource {

    @Inject
    VitrineMediaService vitrineMediaService;

    @GET
    @jakarta.ws.rs.Path("/media/{fileName}")
    @Produces(MediaType.WILDCARD)
    public Response streamMedia(
            @PathParam("fileName") String fileName,
            @QueryParam("download") @DefaultValue("false") boolean download,
            @HeaderParam("Range") String rangeHeader) {
        Path file = vitrineMediaService.resolveFile(fileName);
        if (file == null) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        Response response = vitrineMediaService.stream(file, download, rangeHeader);
        if (!download && (response.getStatus() == Response.Status.OK.getStatusCode()
                || response.getStatus() == Response.Status.PARTIAL_CONTENT.getStatusCode())) {
            return Response.fromResponse(response)
                    .header("Cache-Control", "private, max-age=3600")
                    .build();
        }
        return response;
    }

    public static class ErrorMsg {
        public String error;

        public ErrorMsg(String error) {
            this.error = error;
        }
    }
}
