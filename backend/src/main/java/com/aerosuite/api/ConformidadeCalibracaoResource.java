package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ConformidadeCalibracaoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

@Path("/api/conformidade/calibracao")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"CONFORMIDADE_CALIBRACAO", "GERENCIAR_PERMISSOES", "DOSSIE_AUDITORIA"})
public class ConformidadeCalibracaoResource {

    @Inject
    ConformidadeCalibracaoService service;

    @GET
    public PageResponse<ConformidadeCalibracaoDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q,
            @QueryParam("tipo") String tipo,
            @QueryParam("somenteAtivos") @DefaultValue("true") boolean somenteAtivos) {
        return service.listar(page, size, q, tipo, somenteAtivos);
    }

    @GET
    @Path("/alertas")
    public ConformidadeAlertasResumoDto alertas(@QueryParam("dias") @DefaultValue("30") int dias) {
        return service.alertas(dias);
    }

    @GET
    @Path("/{id}")
    public ConformidadeCalibracaoDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response criar(ConformidadeCalibracaoWriteDto body) {
        return Response.status(Response.Status.CREATED).entity(service.criar(body)).build();
    }

    @PUT
    @Path("/{id}")
    public ConformidadeCalibracaoDto atualizar(@PathParam("id") Long id, ConformidadeCalibracaoWriteDto body) {
        return service.atualizar(id, body);
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }
}
