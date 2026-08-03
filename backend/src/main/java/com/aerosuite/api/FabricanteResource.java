package com.aerosuite.api;

import com.aerosuite.dto.PageResponse;
import com.aerosuite.dto.FabricanteDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.FabricanteService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;

@Path("/api/fabricantes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"FABRICANTES"})
public class FabricanteResource {
    @Inject FabricanteService service;

    @GET
    public PageResponse<FabricanteDto> list(@QueryParam("page") @DefaultValue("0") int page,
                                       @QueryParam("size") @DefaultValue("10") int size,
                                       @QueryParam("sort") @DefaultValue("id,asc") String sort,
                                       @QueryParam("q") String q,
                                       @QueryParam("isActive") String isActiveParam) {
        // Converter string para Boolean (null = true por padrão para filtrar apenas ativos)
        Boolean isActive = null;
        if (isActiveParam != null && !isActiveParam.isBlank()) {
            isActive = Boolean.parseBoolean(isActiveParam);
        }
        
        var result = service.search(page, size, sort, q, isActive);
        long total = result.total();
        int totalPages = (int)Math.ceil((double) total / Math.max(size, 1));
        return new PageResponse<>(result.items(), total, totalPages, page, size, sort);
    }

    @GET @Path("/{id}")
    public FabricanteDto get(@PathParam("id") Integer id) {
        FabricanteDto dto = service.getById(id);
        if (dto == null) {
            throw new NotFoundException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.FABRICANTE_NOT_FOUND, "id", String.valueOf(id)));
        }
        return dto;
    }

    @POST
    public Response create(FabricanteDto dto) {
        FabricanteDto created = service.create(dto);
        return Response.created(URI.create("/api/fabricantes/" + created.id())).entity(created).build();
    }

    @PUT @Path("/{id}")
    public FabricanteDto update(@PathParam("id") Integer id, FabricanteDto dto) {
        // Se o body contém isActive=false, fazer soft delete
        if (dto.isActive() != null && !dto.isActive()) {
            return service.inactivate(id);
        }
        // Caso contrário, atualizar normalmente
        return service.update(id, dto);
    }

    @DELETE @Path("/{id}")
    public Response delete(@PathParam("id") Integer id) {
        // Soft delete - inativar ao invés de deletar fisicamente
        FabricanteDto inactivated = service.delete(id);
        return Response.ok(inactivated).build();
    }
}
