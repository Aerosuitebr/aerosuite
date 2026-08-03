package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.dto.PageResponse;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.TipoServicoDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.TipoServicoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;

@Path("/api/tipos-servico")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"TIPOS_SERVICO"})
public class TipoServicoResource {

    private static final Logger LOG = Logger.getLogger(TipoServicoResource.class);
    @Inject TipoServicoService service;

    @GET
    public PageResponse<TipoServicoDto> list(@QueryParam("page") @DefaultValue("0") int page,
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
    public TipoServicoDto get(@PathParam("id") Integer id) {
        TipoServicoDto dto = service.getById(id);
        if (dto == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_NOT_FOUND, "id", String.valueOf(id)));
        }
        return dto;
    }

    @POST
    public Response create(TipoServicoDto dto) {
        TipoServicoDto created = service.create(dto);
        return Response.created(URI.create("/api/tipos-servico/" + created.id())).entity(created).build();
    }

    @PUT @Path("/{id}")
    public TipoServicoDto update(@PathParam("id") Integer id, TipoServicoDto dto) {
        // Se o body contém isActive=false, fazer soft delete
        if (dto != null && dto.isActive() != null && !dto.isActive()) {
            return service.inactivate(id);
        }
        // Caso contrário, atualizar normalmente
        return service.update(id, dto);
    }

    @DELETE @Path("/{id}")
    public Response delete(@PathParam("id") Integer id) {
        try {
            // Soft delete - inativar ao invés de deletar fisicamente
            TipoServicoDto inactivated = service.delete(id);
            return Response.ok(inactivated).build();
        } catch (IllegalArgumentException e) {
            LOG.warnf(e, "TipoServicoResource.delete - IllegalArgumentException: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.BAD_REQUEST).entity(e.getMessage()).build();
        } catch (Exception e) {
            LOG.warnf(e, "TipoServicoResource.delete - ERRO: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(ApiI18nMessages.withDetail(ApiI18nMessages.TIPO_SERVICO_DEACTIVATE_FAILED, e.getMessage()))
                    .build();
        }
    }
}
