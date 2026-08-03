package com.aerosuite.api;

import com.aerosuite.dto.ClientePropostaDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.ClientePropostaService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

@Path("/api/clientes-proposta")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@RequiresFuncionalidades(allOf = {"propostas-comerciais"})
public class ClientePropostaResource {

    @Inject
    ClientePropostaService service;

    @GET
    public Response search(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("10") Integer size,
            @QueryParam("sort") String sort,
            @QueryParam("q") String q,
            @QueryParam("isActive") String isActiveParam) {
        
        Boolean isActive = null;
        if (isActiveParam != null && !isActiveParam.isBlank()) {
            isActive = Boolean.parseBoolean(isActiveParam);
        }
        
        var result = service.search(page, size, sort, q, isActive);
        return Response.ok(result).build();
    }

    @GET
    @Path("/all")
    public Response findAll() {
        var result = service.findAll();
        return Response.ok(result).build();
    }

    @GET
    @Path("/search-by-name")
    public Response searchByName(@QueryParam("nome") String nome) {
        var result = service.searchByName(nome);
        return Response.ok(result).build();
    }

    @GET
    @Path("/{id}")
    public Response findById(@PathParam("id") Integer id) {
        ClientePropostaDto dto = service.findById(id);
        if (dto == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.encode(
                            ApiI18nMessages.CLIENTE_NOT_FOUND, "id", String.valueOf(id))))
                    .build();
        }
        return Response.ok(dto).build();
    }

    @GET
    @Path("/by-cnpj/{cnpjCpf}")
    public Response findByCnpjCpf(@PathParam("cnpjCpf") String cnpjCpf) {
        ClientePropostaDto dto = service.findByCnpjCpf(cnpjCpf);
        if (dto == null) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.CLIENTE_NOT_FOUND_GENERIC)))
                    .build();
        }
        return Response.ok(dto).build();
    }

    @POST
    public Response create(ClientePropostaDto dto) {
        try {
            ClientePropostaDto created = service.create(dto);
            return Response.status(Response.Status.CREATED).entity(created).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.CLIENTE_CREATE_FAILED, e.getMessage())))
                    .build();
        }
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Integer id, ClientePropostaDto dto) {
        try {
            ClientePropostaDto updated = service.update(id, dto);
            return Response.ok(updated).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.CLIENTE_NOT_FOUND, e.getMessage())))
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
                            ApiI18nMessages.CLIENTE_NOT_FOUND, e.getMessage())))
                    .build();
        }
    }
}
