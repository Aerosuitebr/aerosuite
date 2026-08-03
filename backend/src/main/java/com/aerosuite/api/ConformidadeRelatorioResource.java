package com.aerosuite.api;

import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeSgqExportService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;

/** P5.4 — Exportação SGQ standalone (CSV/ZIP por módulo). */
@Path("/api/conformidade/relatorios")
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_PAINEL", "DOSSIE_AUDITORIA", "SGQ_DOCUMENTO_CONTROLADO"})
public class ConformidadeRelatorioResource {

    @Inject
    ConformidadeSgqExportService sgqExportService;

    @GET
    @Path("/sgq.zip")
    @Produces("application/zip")
    public Response exportSgqZip(@QueryParam("dias") @DefaultValue("60") int dias) {
        try {
            byte[] zip = sgqExportService.buildRelatorioSgqZip(dias);
            StreamingOutput stream = output -> output.write(zip);
            return Response.ok(stream)
                    .header(
                            "Content-Disposition",
                            "attachment; filename=\"" + sgqExportService.suggestedRelatorioZipName() + "\"")
                    .type("application/zip")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .type(MediaType.APPLICATION_JSON)
                    .entity(new ErrorBody("conformidade.relatorio.error.export", e.getMessage()))
                    .build();
        }
    }

    public static class ErrorBody {
        public String code;
        public String message;

        public ErrorBody(String code, String message) {
            this.code = code;
            this.message = message;
        }
    }
}
