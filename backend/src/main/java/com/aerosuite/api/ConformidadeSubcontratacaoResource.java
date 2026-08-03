package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeSubcontratacaoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/conformidade/subcontratacao")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_SUBCONTRATACAO", "GERENCIAR_PERMISSOES", "DOSSIE_AUDITORIA"})
public class ConformidadeSubcontratacaoResource {

    @Inject
    ConformidadeSubcontratacaoService service;

    @GET
    public PageResponse<ConformidadeSubcontratacaoDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q,
            @QueryParam("status") String status,
            @QueryParam("osId") Integer osId) {
        return service.listar(page, size, q, status, osId);
    }

    @GET
    @Path("/alertas")
    public ConformidadeAlertasResumoDto alertas(@QueryParam("dias") @DefaultValue("60") int dias) {
        return service.alertas(dias);
    }

    @GET
    @Path("/{id}")
    public ConformidadeSubcontratacaoDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response criar(ConformidadeSubcontratacaoWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.criar(body)).build();
    }

    @PUT
    @Path("/{id}")
    public ConformidadeSubcontratacaoDto atualizar(@PathParam("id") Long id, ConformidadeSubcontratacaoWriteDto body) {
        return service.atualizar(id, body);
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }
}
