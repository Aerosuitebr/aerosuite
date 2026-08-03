package com.aerosuite.api;

import com.aerosuite.dto.*;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.UsuarioHabilitacaoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

/**
 * B7 — habilitações técnicas de usuários internos (mecânico, inspetor, RT).
 */
@Path("/api/conformidade/habilitacoes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(anyOf = {"HABILITACAO_TECNICA", "GERENCIAR_PERMISSOES", "USUARIOS"})
public class UsuarioHabilitacaoResource {

    @Inject
    UsuarioHabilitacaoService service;

    @GET
    public PageResponse<UsuarioHabilitacaoDto> listar(
            @QueryParam("page") @DefaultValue("0") int page,
            @QueryParam("size") @DefaultValue("20") int size,
            @QueryParam("q") String q,
            @QueryParam("tipo") String tipo,
            @QueryParam("usuarioId") Integer usuarioId,
            @QueryParam("somenteAtivas") @DefaultValue("true") boolean somenteAtivas) {
        return service.listar(page, size, q, tipo, usuarioId, somenteAtivas);
    }

    @GET
    @Path("/alertas")
    public UsuarioHabilitacaoAlertasResumoDto alertas(@QueryParam("dias") @DefaultValue("60") int dias) {
        return service.alertas(dias);
    }

    @GET
    @Path("/usuario/{usuarioId}")
    public List<UsuarioHabilitacaoDto> porUsuario(@PathParam("usuarioId") Integer usuarioId) {
        return service.porUsuario(usuarioId);
    }

    @GET
    @Path("/{id}")
    public UsuarioHabilitacaoDto obter(@PathParam("id") Long id) {
        return service.obter(id);
    }

    @POST
    public Response criar(UsuarioHabilitacaoWriteDto body) {
        UsuarioHabilitacaoDto created = service.criar(body);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public UsuarioHabilitacaoDto atualizar(@PathParam("id") Long id, UsuarioHabilitacaoWriteDto body) {
        return service.atualizar(id, body);
    }

    @DELETE
    @Path("/{id}")
    public Response excluir(@PathParam("id") Long id) {
        service.excluir(id);
        return Response.noContent().build();
    }
}
