package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeTreinamentoObrigatorioService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/conformidade/treinamentos-obrigatorios")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_TREINAMENTO_OBRIG", "CONFORMIDADE_TREINAMENTO"})
public class ConformidadeTreinamentoObrigatorioResource {

    @Inject
    ConformidadeTreinamentoObrigatorioService service;

    @GET
    public Response listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("funcao") String funcao,
            @QueryParam("q") String q) {
        return Response.ok(service.listar(page, size, funcao, q)).build();
    }

    @GET
    @Path("/{id}")
    public Response obter(@PathParam("id") Long id) {
        return Response.ok(service.obter(id)).build();
    }

    @POST
    public Response criar(ConformidadeTreinamentoObrigatorioWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.criar(body)).build();
    }

    @PUT
    @Path("/{id}")
    public Response atualizar(@PathParam("id") Long id, ConformidadeTreinamentoObrigatorioWriteDto body) {
        return Response.ok(service.atualizar(id, body)).build();
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }
}
