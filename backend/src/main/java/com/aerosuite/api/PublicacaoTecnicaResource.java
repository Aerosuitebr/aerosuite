package com.aerosuite.api;

import com.aerosuite.dto.PublicacaoTecnicaDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.PublicacaoTecnicaService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/api/publicacoes-tecnicas")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@RequiresFuncionalidades(anyOf = {"PUBLICACOES_TECNICAS", "PUBLICACAO_CADASTRO", "PUBLICACAO_ASSOCIAR_PN"})
public class PublicacaoTecnicaResource {

    @Inject
    PublicacaoTecnicaService service;

    @GET
    public Response search(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("10") Integer size,
            @QueryParam("sort") String sort,
            @QueryParam("q") String q,
            @QueryParam("fabricanteId") Integer fabricanteId,
            @QueryParam("isActive") String isActiveParam) {
        
        Boolean isActive = null;
        if (isActiveParam != null && !isActiveParam.isBlank()) {
            isActive = Boolean.parseBoolean(isActiveParam);
        }
        
        var result = service.search(page, size, sort, q, fabricanteId, isActive);
        return Response.ok(result).build();
    }

    @GET
    @Path("/all")
    public Response findAll() {
        var result = service.findAll();
        return Response.ok(result).build();
    }

    @GET
    @Path("/{id}")
    public Response findById(@PathParam("id") Integer id) {
        PublicacaoTecnicaDto dto = service.findById(id);
        if (dto == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_NOT_FOUND)))
                    .build();
        }
        return Response.ok(dto).build();
    }

    @POST
    public Response create(PublicacaoTecnicaDto dto) {
        try {
            PublicacaoTecnicaDto created = service.create(dto);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.PUBLICACAO_CREATE_FAILED, e.getMessage())))
                    .build();
        }
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Integer id, PublicacaoTecnicaDto dto) {
        try {
            PublicacaoTecnicaDto updated = service.update(id, dto);
            return Response.ok(updated).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.PUBLICACAO_NOT_FOUND, e.getMessage())))
                    .build();
        }
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Integer id) {
        try {
            service.delete(id);
            return Response.noContent().build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.PUBLICACAO_NOT_FOUND, e.getMessage())))
                    .build();
        }
    }
}
