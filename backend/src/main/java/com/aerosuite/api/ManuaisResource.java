package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.PathParam;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import com.aerosuite.security.RequiresFuncionalidades;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.Map;

/**
 * Serve PDFs da pasta {@code manuals/} na raiz do repositório Aero Suite
 * (ex.: {@code aerosuite/manuals/Estoque_minimo_Manual.pdf}).
 * <p>
 * Caminho configurável via {@code aero.suite.manuals.path} ou {@code AERO_SUITE_MANUALS_PATH}.
 * Valor relativo é resolvido a partir da raiz do projeto (pasta que contém {@code backend/} e {@code manuals/}).
 * Docker: {@code AERO_SUITE_MANUALS_PATH=/app/manuals} com volume {@code ./manuals:/app/manuals}.
 */
@Path("/api/manuals")
@RequiresFuncionalidades(onlyAuthenticated = true)
public class ManuaisResource {

    @Inject
    @ConfigProperty(name = "aero.suite.manuals.path", defaultValue = "manuals")
    String manualsPath;

    @GET
    @Path("/{filename}")
    @Produces("application/pdf")
    public Response getManual(@PathParam("filename") String filename) {
        if (filename == null || filename.isBlank()) {
            return Response.status(Response.Status.BAD_REQUEST).build();
        }
        if (!filename.matches("[a-zA-Z0-9_.\\-]+")) {
            return jsonError(Response.Status.BAD_REQUEST, ApiI18nMessages.encode(ApiI18nMessages.MANUAL_INVALID_FILENAME));
        }
        java.nio.file.Path base = resolveManualsBase();
        java.nio.file.Path file = base.resolve(filename).normalize();
        if (!file.startsWith(base)) {
            return Response.status(Response.Status.FORBIDDEN).build();
        }
        if (!Files.isRegularFile(file)) {
            return jsonError(Response.Status.NOT_FOUND, ApiI18nMessages.encode(
                    ApiI18nMessages.MANUAL_NOT_FOUND, "filename", filename));
        }
        try {
            byte[] bytes = Files.readAllBytes(file);
            return Response.ok(bytes)
                    .type("application/pdf")
                    .header("Content-Disposition", "inline; filename=\"" + filename + "\"")
                    .build();
        } catch (IOException e) {
            return jsonError(Response.Status.INTERNAL_SERVER_ERROR,
                    ApiI18nMessages.withDetail(ApiI18nMessages.MANUAL_READ_FAILED, e.getMessage()));
        }
    }

    /**
     * Raiz do repositório: sobe a partir do cwd até encontrar {@code manuals/} ou {@code backend/}+{@code frontend/}.
     */
    static java.nio.file.Path resolveProjectRoot() {
        java.nio.file.Path cur = Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
        for (int depth = 0; depth < 8; depth++) {
            if (Files.isDirectory(cur.resolve("manuals"))) {
                return cur;
            }
            if (Files.isDirectory(cur.resolve("backend")) && Files.isDirectory(cur.resolve("frontend"))) {
                return cur;
            }
            java.nio.file.Path parent = cur.getParent();
            if (parent == null || parent.equals(cur)) {
                break;
            }
            cur = parent;
        }
        return Paths.get(System.getProperty("user.dir", ".")).toAbsolutePath().normalize();
    }

    private java.nio.file.Path resolveManualsBase() {
        java.nio.file.Path configured = Paths.get(manualsPath.trim());
        if (configured.isAbsolute()) {
            return configured.normalize();
        }

        java.nio.file.Path projectRoot = resolveProjectRoot();
        java.nio.file.Path fromRoot = projectRoot.resolve(configured).normalize();
        if (Files.isDirectory(fromRoot)) {
            return fromRoot;
        }

        java.nio.file.Path fromCwd = Paths.get(System.getProperty("user.dir", "."))
                .resolve(configured)
                .toAbsolutePath()
                .normalize();
        if (Files.isDirectory(fromCwd)) {
            return fromCwd;
        }

        return fromRoot;
    }

    private static Response jsonError(Response.Status status, String encodedMessage) {
        return Response.status(status)
                .type(MediaType.APPLICATION_JSON)
                .entity(Map.of("message", encodedMessage != null ? encodedMessage : ""))
                .build();
    }
}
