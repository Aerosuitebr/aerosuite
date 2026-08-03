package com.aerosuite.api;

import com.aerosuite.service.UsuarioFotoStorage;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.Response;
/**
 * Serve fotos de perfil sem exigir permissão USUARIOS (imagens em &lt;img&gt; não enviam Bearer).
 */
@Path("/api/public/usuario-foto")
public class UsuarioFotoPublicResource {

    @Inject
    UsuarioFotoStorage fotoStorage;

    @GET
    @Path("/{filename}")
    @Produces({"image/jpeg", "image/png", "image/gif", "image/webp"})
    public Response getFoto(@PathParam("filename") String filename) {
        if (filename == null || filename.isBlank() || filename.contains("..") || filename.contains("/") || filename.contains("\\")) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }

        try {
            byte[] imageBytes = fotoStorage.loadImageBytes(filename);
            if (imageBytes == null || imageBytes.length == 0) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            String contentType = contentTypeFromFilename(filename);
            return Response.ok(imageBytes)
                    .type(contentType)
                    .header("Cache-Control", "public, max-age=300")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    private static String contentTypeFromFilename(String filename) {
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }
}
