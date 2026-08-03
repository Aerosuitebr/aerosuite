package com.aerosuite.api;

import com.aerosuite.domain.OS;
import com.aerosuite.dto.DossieAuditoriaResumoDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.dto.PacoteAuditoriaTenantResumoDto;
import com.aerosuite.service.DossieAuditoriaService;
import com.aerosuite.service.PacoteAuditoriaTenantService;
import com.aerosuite.service.PacoteAuditoriaTenantService.PeriodoCampo;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.core.StreamingOutput;

import java.time.LocalDate;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Collectors;

/**
 * P4.4 — exportação do dossiê de auditoria (PDF) por OS.
 */
@Path("/api/dossie-auditoria")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"DOSSIE_AUDITORIA", "ORDEM_SERVICO", "GERENCIAR_PERMISSOES"})
public class DossieAuditoriaResource {

    @Inject
    DossieAuditoriaService dossieService;

    @Inject
    PacoteAuditoriaTenantService pacoteService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @GET
    @Path("/os/{osId}/resumo")
    public Response resumoById(@PathParam("osId") Long osId) {
        return Response.ok(dossieService.resumo(osId, null)).build();
    }

    @GET
    @Path("/numero/{numeroOs}/resumo")
    public Response resumoByNumero(@PathParam("numeroOs") Integer numeroOs) {
        return Response.ok(dossieService.resumo(null, numeroOs)).build();
    }

    @GET
    @Path("/os/{osId}/pdf")
    @Produces("application/pdf")
    public Response pdfById(
            @PathParam("osId") Long osId,
            @QueryParam("locale") @DefaultValue("pt-BR") String locale) {
        return buildPdfResponse(osId, null, locale);
    }

    @GET
    @Path("/numero/{numeroOs}/pdf")
    @Produces("application/pdf")
    public Response pdfByNumero(
            @PathParam("numeroOs") Integer numeroOs,
            @QueryParam("locale") @DefaultValue("pt-BR") String locale) {
        return buildPdfResponse(null, numeroOs, locale);
    }

    @GET
    @Path("/pacote/resumo")
    public Response pacoteResumo(
            @QueryParam("dataInicio") String dataInicio,
            @QueryParam("dataFim") String dataFim,
            @QueryParam("limite") @DefaultValue("30") int limite,
            @QueryParam("numerosOs") String numerosOsCsv,
            @QueryParam("periodoCampo") @DefaultValue("abertura") String periodoCampo) {
        try {
            PacoteAuditoriaTenantResumoDto resumo =
                    pacoteService.preview(
                            parseDate(dataInicio),
                            parseDate(dataFim),
                            limite,
                            parseNumeros(numerosOsCsv),
                            parsePeriodoCampo(periodoCampo));
            return Response.ok(resumo).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorBody("pacote.invalid", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/pacote/zip")
    @Produces("application/zip")
    public Response pacoteZip(
            @QueryParam("dataInicio") String dataInicio,
            @QueryParam("dataFim") String dataFim,
            @QueryParam("limite") @DefaultValue("30") int limite,
            @QueryParam("numerosOs") String numerosOsCsv,
            @QueryParam("locale") @DefaultValue("pt-BR") String locale,
            @QueryParam("periodoCampo") @DefaultValue("abertura") String periodoCampo) {
        try {
            byte[] zip =
                    pacoteService.exportZip(
                            parseDate(dataInicio),
                            parseDate(dataFim),
                            limite,
                            parseNumeros(numerosOsCsv),
                            locale,
                            parsePeriodoCampo(periodoCampo),
                            null);
            StreamingOutput stream = output -> output.write(zip);
            return Response.ok(stream)
                    .header("Content-Disposition", "attachment; filename=\"" + pacoteService.suggestedZipName() + "\"")
                    .type("application/zip")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorBody("pacote.export.failed", e.getMessage()))
                    .build();
        }
    }

    private static LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return LocalDate.parse(raw.trim());
    }

    private static PeriodoCampo parsePeriodoCampo(String raw) {
        if (raw != null && raw.trim().equalsIgnoreCase("fechamento")) {
            return PeriodoCampo.FECHAMENTO;
        }
        return PeriodoCampo.ABERTURA;
    }

    private static List<Integer> parseNumeros(String csv) {
        if (csv == null || csv.isBlank()) {
            return List.of();
        }
        return Arrays.stream(csv.split("[,;\\s]+"))
                .map(String::trim)
                .filter(s -> !s.isEmpty())
                .map(Integer::parseInt)
                .collect(Collectors.toList());
    }

    private Response buildPdfResponse(Long osId, Integer numeroOs, String locale) {
        try {
            OS os = osId != null ? tenantDataAccess.requireOS(osId) : tenantDataAccess.requireOSByIdOs(numeroOs);
            byte[] pdf = dossieService.exportPdf(os.id, null, locale);
            String fileName = dossieService.suggestedFileName(os);
            StreamingOutput stream = output -> output.write(pdf);
            return Response.ok(stream)
                    .header("Content-Disposition", "attachment; filename=\"" + fileName + "\"")
                    .type("application/pdf")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorBody("dossie.export.failed", e.getMessage()))
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
