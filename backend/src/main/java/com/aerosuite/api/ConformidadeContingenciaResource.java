package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeContingenciaService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/conformidade/contingencia")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_PAINEL", "CONFORMIDADE_NC", "GERENCIAR_PERMISSOES", "DOSSIE_AUDITORIA"})
public class ConformidadeContingenciaResource {

    @Inject
    ConformidadeContingenciaService service;

    @GET
    public PageResponse<ConformidadeContingenciaDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q,
            @QueryParam("status") String status) {
        return service.listar(page, size, q, status);
    }

    @GET
    @Path("/checklist-padrao")
    public List<ConformidadeChecklistItemDto> checklistPadrao() {
        return service.checklistPadrao();
    }

    @GET
    @Path("/{id}")
    public ConformidadeContingenciaDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response criar(ConformidadeContingenciaWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.criar(body)).build();
    }

    @PUT
    @Path("/{id}")
    public ConformidadeContingenciaDto atualizar(@PathParam("id") Long id, ConformidadeContingenciaWriteDto body) {
        return service.atualizar(id, body);
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }
}
