package com.aerosuite.api;

import com.aerosuite.service.EmpresaAssetService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.core.Response;

import java.io.IOException;
import java.io.InputStream;

/**
 * Serve logo e wordmark carregados pelo painel da empresa (sem JWT).
 */
@Path("/api/public/empresa-asset")
public class PublicEmpresaAssetResource {

    @Inject
    EmpresaAssetService empresaAssetService;

    @GET
    @Path("/logo")
    public Response getLogo() {
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @GET
    @Path("/{tenantCodigo}/logo")
    public Response getLogoForTenant(@jakarta.ws.rs.PathParam("tenantCodigo") String tenantCodigo) {
        return streamImage(
                () -> empresaAssetService.openLogoForTenantCodigo(tenantCodigo),
                () -> empresaAssetService.guessLogoMediaTypeForTenantCodigo(tenantCodigo));
    }

    @GET
    @Path("/wordmark")
    public Response getWordmark() {
        return Response.status(Response.Status.NOT_FOUND).build();
    }

    @GET
    @Path("/{tenantCodigo}/wordmark")
    public Response getWordmarkForTenant(@jakarta.ws.rs.PathParam("tenantCodigo") String tenantCodigo) {
        return streamImage(
                () -> empresaAssetService.openWordmarkForTenantCodigo(tenantCodigo),
                () -> empresaAssetService.guessWordmarkMediaTypeForTenantCodigo(tenantCodigo));
    }

    private Response streamImage(IOSupplier in, MediaSupplier media) {
        try {
            InputStream input = in.open();
            if (input == null) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            String type = media.type();
            return Response.ok(input, type)
                    .header("Cache-Control", "public, max-age=3600")
                    .build();
        } catch (IOException e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    @FunctionalInterface
    private interface IOSupplier {
        InputStream open() throws IOException;
    }

    @FunctionalInterface
    private interface MediaSupplier {
        String type() throws IOException;
    }
}
