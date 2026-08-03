package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.AeroDiretrizService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

/**
 * B6 — AD/SB e alertas de cumprimento.
 */
@Path("/api/aero/diretrizes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"AD_SB_ALERTAS", "ORDEM_SERVICO", "FCU"})
public class AeroDiretrizResource {

    @Inject
    AeroDiretrizService service;

    @GET
    public PageResponse<AeroDiretrizDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q,
            @QueryParam("tipo") String tipo,
            @QueryParam("status") String status,
            @QueryParam("fcuId") Integer fcuId) {
        return service.listar(page, size, q, tipo, status, fcuId);
    }

    @GET
    @Path("/alertas")
    public AeroDiretrizAlertasResumoDto alertas(@QueryParam("dias") @DefaultValue("30") int dias) {
        return service.alertas(dias);
    }

    @GET
    @Path("/aplicaveis")
    public Response aplicaveis(
            @QueryParam("fcuId") Integer fcuId,
            @QueryParam("partNumber") String partNumber,
            @QueryParam("serialNumber") String serialNumber) {
        return Response.ok(Map.of("itens", service.aplicaveis(fcuId, partNumber, serialNumber))).build();
    }

    @GET
    @Path("/{id}")
    public AeroDiretrizDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response criar(AeroDiretrizWriteDto body) {
        AeroDiretrizDto created = service.criar(body);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public AeroDiretrizDto atualizar(@PathParam("id") Long id, AeroDiretrizWriteDto body) {
        return service.atualizar(id, body);
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }
}
