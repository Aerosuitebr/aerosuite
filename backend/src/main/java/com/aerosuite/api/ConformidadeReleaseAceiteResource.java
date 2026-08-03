package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeReleaseAceiteService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/conformidade/releases")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_PAINEL", "GERENCIAR_PERMISSOES", "DOSSIE_AUDITORIA"})
public class ConformidadeReleaseAceiteResource {

    @Inject
    ConformidadeReleaseAceiteService service;

    @GET
    public PageResponse<ConformidadeReleaseAceiteDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size) {
        return service.listar(page, size);
    }

    @GET
    @Path("/meta")
    public ConformidadeReleaseMetaDto metaAtual() {
        return service.metaAtual();
    }

    @GET
    @Path("/checklist-padrao")
    public List<ConformidadeChecklistItemDto> checklistPadrao() {
        return service.checklistPadrao();
    }

    @GET
    @Path("/{id}")
    public ConformidadeReleaseAceiteDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response registrar(ConformidadeReleaseAceiteWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.registrar(body)).build();
    }
}
