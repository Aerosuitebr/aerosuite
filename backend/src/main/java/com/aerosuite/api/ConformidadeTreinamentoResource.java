package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeTreinamentoListaPresencaService;
import com.aerosuite.service.ConformidadeTreinamentoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/conformidade/treinamentos")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_TREINAMENTO", "GERENCIAR_PERMISSOES", "USUARIOS"})
public class ConformidadeTreinamentoResource {

    @Inject
    ConformidadeTreinamentoService service;

    @Inject
    ConformidadeTreinamentoListaPresencaService listaPresencaService;

    @GET
    public PageResponse<ConformidadeTreinamentoDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q,
            @QueryParam("usuarioId") Integer usuarioId,
            @QueryParam("somenteAtivos") @DefaultValue("true") boolean somenteAtivos) {
        return service.listar(page, size, q, usuarioId, somenteAtivos);
    }

    @GET
    @Path("/alertas")
    public ConformidadeAlertasResumoDto alertas(@QueryParam("dias") @DefaultValue("60") int dias) {
        return service.alertas(dias);
    }

    @GET
    @Path("/lista-presenca/pdf")
    @Produces("application/pdf")
    public Response listaPresencaPdf(@QueryParam("turmaRef") String turmaRef) {
        byte[] pdf = listaPresencaService.gerarPdf(turmaRef);
        String safe = turmaRef != null ? turmaRef.replaceAll("[^a-zA-Z0-9._-]+", "_") : "turma";
        return Response.ok(pdf)
                .header("Content-Disposition", "attachment; filename=\"lista-presenca-" + safe + ".pdf\"")
                .build();
    }

    @GET
    @Path("/{id}")
    public ConformidadeTreinamentoDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response criar(ConformidadeTreinamentoWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.criar(body)).build();
    }

    @PUT
    @Path("/{id}")
    public ConformidadeTreinamentoDto atualizar(@PathParam("id") Long id, ConformidadeTreinamentoWriteDto body) {
        return service.atualizar(id, body);
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }
}
