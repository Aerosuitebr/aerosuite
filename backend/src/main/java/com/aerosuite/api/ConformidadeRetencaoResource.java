package com.aerosuite.api;

import com.aerosuite.dto.RetencaoRegistrosConfigDto;
import com.aerosuite.dto.RetencaoRegistrosInventarioDto;
import com.aerosuite.dto.RetencaoRegistrosUpdateDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.RetencaoRegistrosService;
import jakarta.inject.Inject;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;

import java.time.LocalDate;

/**
 * B4 — retenção e exportação de registros de manutenção (arquivo morto).
 */
@Path("/api/conformidade/retencao")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"DOSSIE_AUDITORIA", "ORDEM_SERVICO", "GERENCIAR_PERMISSOES"})
public class ConformidadeRetencaoResource {

    @Inject
    RetencaoRegistrosService retencaoService;

    @GET
    public Response getConfig() {
        return Response.ok(retencaoService.getConfig()).build();
    }

    @PUT
    @RequiresFuncionalidades(anyOf = {"GERENCIAR_PERMISSOES", "DOSSIE_AUDITORIA"})
    public Response putConfig(RetencaoRegistrosUpdateDto body) {
        try {
            RetencaoRegistrosConfigDto saved = retencaoService.updateConfig(body != null ? body.anosRetencao : null);
            return Response.ok(saved).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorBody(e.getMessage(), e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/inventario")
    public Response inventario() {
        RetencaoRegistrosInventarioDto dto = retencaoService.inventario();
        return Response.ok(dto).build();
    }

    @GET
    @Path("/export/zip")
    @Produces("application/zip")
    public Response exportZip(
            @QueryParam("dataInicio") String dataInicio,
            @QueryParam("dataFim") String dataFim,
            @QueryParam("limite") @DefaultValue("30") int limite,
            @QueryParam("locale") @DefaultValue("pt-BR") String locale) {
        try {
            byte[] zip =
                    retencaoService.exportArquivoMorto(parseDate(dataInicio), parseDate(dataFim), limite, locale);
            StreamingOutput stream = output -> output.write(zip);
            return Response.ok(stream)
                    .header(
                            "Content-Disposition",
                            "attachment; filename=\"" + retencaoService.suggestedArquivoMortoZipName() + "\"")
                    .type("application/zip")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorBody("conformidade.retencao.error.export", e.getMessage()))
                    .build();
        }
    }

    private static LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return LocalDate.parse(raw.trim());
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
