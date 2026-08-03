package com.aerosuite.api;

import com.aerosuite.dto.TemplateProdutoServicoDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.TemplateProdutoServicoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;

@Path("/api/templates-produto-servico")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"templates-proposta"})
public class TemplateProdutoServicoResource {

    @Inject
    TemplateProdutoServicoService service;

    @GET
    public Response list(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("20") Integer size,
            @QueryParam("sort") String sort,
            @QueryParam("q") String q,
            @QueryParam("categoria") String categoria,
            @QueryParam("ativo") Boolean ativo) {
        
        TemplateProdutoServicoService.SearchResult result = service.search(page, size, sort, q, categoria, ativo);
        return Response.ok(result).build();
    }

    @GET
    @Path("/categorias")
    public Response listCategorias() {
        List<String> categorias = service.listCategorias();
        return Response.ok(categorias).build();
    }

    @GET
    @Path("/{id}")
    public Response getById(@PathParam("id") Long id) {
        TemplateProdutoServicoDto dto = service.findById(id);
        return Response.ok(dto).build();
    }

    @POST
    public Response create(TemplateProdutoServicoDto dto) {
        TemplateProdutoServicoDto created = service.create(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Long id, TemplateProdutoServicoDto dto) {
        TemplateProdutoServicoDto updated = service.update(id, dto);
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Long id) {
        service.delete(id);
        return Response.noContent().build();
    }

    @POST
    @Path("/{id}/registrar-uso")
    public Response registrarUso(@PathParam("id") Long id) {
        service.registrarUso(id);
        return Response.ok().build();
    }
}
