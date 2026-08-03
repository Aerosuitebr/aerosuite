package com.aerosuite.api;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.OsJobCardService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

/**
 * P5.2 — Job card mobile (hangar): consulta OS abertas, horas, execução e assinatura.
 */
@Path("/api/os/job-card")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"HANGAR_JOB_CARD", "ORDEM_SERVICO"})
public class OsJobCardResource {

    @Inject
    OsJobCardService jobCardService;

    @GET
    @Path("/abertas")
    public Response listarAbertas(
            @QueryParam("q") String q, @QueryParam("limite") @DefaultValue("30") int limite) {
        List<OsJobCardListaItemDto> itens = jobCardService.listarAbertas(q, limite);
        return Response.ok(Map.of("itens", itens, "total", itens.size())).build();
    }

    @GET
    @Path("/{osId}")
    public Response obter(@PathParam("osId") Long osId) {
        try {
            return Response.ok(jobCardService.obter(osId)).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorBody("hangar.jobcard.error.os_nao_encontrada", e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/{osId}/apontamentos")
    public Response apontamento(
            @PathParam("osId") Long osId,
            OsJobCardApontamentoRequest body,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            AuditoriaUsuarioContext ctx = AuditoriaUsuarioContext.from(headers, forwardedFor, realIp);
            OsJobCardApontamentoDto saved = jobCardService.registrarApontamento(osId, body, ctx);
            return Response.status(Response.Status.CREATED).entity(saved).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorBody(e.getMessage(), e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/{osId}/execucao")
    public Response execucao(
            @PathParam("osId") Long osId,
            OsJobCardExecucaoRequest body,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            AuditoriaUsuarioContext ctx = AuditoriaUsuarioContext.from(headers, forwardedFor, realIp);
            OsJobCardDto dto = jobCardService.atualizarExecucao(osId, body, ctx);
            return Response.ok(dto).build();
        } catch (BadRequestException | NotFoundException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorBody(e.getMessage(), e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/{osId}/assinatura")
    public Response assinatura(
            @PathParam("osId") Long osId,
            OsJobCardAssinaturaRequest body,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            AuditoriaUsuarioContext ctx = AuditoriaUsuarioContext.from(headers, forwardedFor, realIp);
            OsJobCardAssinaturaDto saved = jobCardService.salvarAssinatura(osId, body, ctx);
            return Response.ok(saved).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorBody(e.getMessage(), e.getMessage()))
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
