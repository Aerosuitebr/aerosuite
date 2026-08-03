package com.aerosuite.api;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.dto.CapacidadeOsBatchRequest;
import com.aerosuite.dto.CapacidadeOsUpdateRequest;
import com.aerosuite.dto.CapacidadeQuadroCardDto;
import com.aerosuite.dto.CapacidadeQuadroDto;
import com.aerosuite.dto.HangarDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.CapacidadeFilaService;
import com.aerosuite.service.HangarService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

/**
 * P5.3 — Quadro de capacidade / AOG (kanban de OS abertas).
 */
@Path("/api/capacidade")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"QUADRO_CAPACIDADE", "ORDEM_SERVICO"})
public class CapacidadeResource {

    @Inject
    CapacidadeFilaService capacidadeFilaService;

    @Inject
    HangarService hangarService;

    @GET
    @Path("/hangares")
    public java.util.List<HangarDto> hangares() {
        return hangarService.listarAtivos();
    }

    @GET
    @Path("/quadro")
    public CapacidadeQuadroDto quadro(@QueryParam("hangarId") Long hangarId) {
        return capacidadeFilaService.obterQuadro(hangarId);
    }

    @PUT
    @Path("/os/batch")
    public Response atualizarLote(
            CapacidadeOsBatchRequest body,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            AuditoriaUsuarioContext ctx = AuditoriaUsuarioContext.from(headers, forwardedFor, realIp);
            return Response.ok(capacidadeFilaService.atualizarOsEmLote(body, ctx)).build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorBody(e.getMessage()))
                    .build();
        }
    }

    @PUT
    @Path("/os/{osId}")
    public Response atualizar(
            @PathParam("osId") Long osId,
            CapacidadeOsUpdateRequest body,
            @HeaderParam("X-Forwarded-For") String forwardedFor,
            @HeaderParam("X-Real-IP") String realIp,
            @Context HttpHeaders headers) {
        try {
            AuditoriaUsuarioContext ctx = AuditoriaUsuarioContext.from(headers, forwardedFor, realIp);
            CapacidadeQuadroCardDto card = capacidadeFilaService.atualizarOs(osId, body, ctx);
            return Response.ok(card).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorBody(e.getMessage()))
                    .build();
        } catch (BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorBody(e.getMessage()))
                    .build();
        }
    }

    public record ErrorBody(String code) {}
}
