package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.dto.PageResponse;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.FcuDto;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.FcuService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.net.URI;

@Path("/api/fcu")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(allOf = {"FCU"})
public class FcuResource {

    private static final Logger LOG = Logger.getLogger(FcuResource.class);
    @Inject FcuService service;

    @GET
    public PageResponse<FcuDto> list(@QueryParam("page") @DefaultValue("0") int page,
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
        int totalPages = (int) Math.ceil((double) total / Math.max(size, 1));
        return new PageResponse<>(result.items(), total, totalPages, page, size, sort);
    }

    @GET @Path("/{id}")
    public FcuDto get(@PathParam("id") Long id, @QueryParam("includeInactive") @DefaultValue("false") boolean includeInactive) {
        // Se includeInactive=true, buscar sem filtro de isActive
        FcuDto dto = includeInactive ? service.getByIdIncludingInactive(id) : service.getById(id);
        if (dto == null) {
            throw new NotFoundException(
                    ApiI18nMessages.encode(ApiI18nMessages.FCU_NOT_FOUND, "id", String.valueOf(id)));
        }
        return dto;
    }

    @POST
    public Response create(FcuDto dto) {
        FcuDto created = service.create(dto);
        return Response.created(URI.create("/api/fcu/" + created.id())).entity(created).build();
    }

    @PUT @Path("/{id}")
    public Response update(@PathParam("id") Long id, FcuDto dto) {
        try {
            
            FcuDto result;
            
            // Se o body contém apenas isActive=false (ou isActive=false junto com outros campos), fazer soft delete
            if (dto != null && dto.isActive() != null && !dto.isActive()) {
                result = service.inactivate(id);
            } else {
                // Caso contrário, atualizar normalmente
                result = service.update(id, dto);
            }
            
            return Response.ok(result).build();
        } catch (IllegalArgumentException e) {
            LOG.warnf(e, "FcuResource.update - IllegalArgumentException: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", ApiI18nMessages.messageOrFallback(
                    ApiI18nMessages.FCU_UPDATE_FAILED, e.getMessage()));
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(errorResponse)
                .build();
        } catch (RuntimeException e) {
            LOG.warnf(e, "FcuResource.update - RuntimeException: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", ApiI18nMessages.messageOrFallback(
                    ApiI18nMessages.FCU_UPDATE_FAILED, e.getMessage()));
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(errorResponse)
                .build();
        } catch (Exception e) {
            LOG.warnf(e, "FcuResource.update - Exception: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", ApiI18nMessages.withDetail(
                    ApiI18nMessages.FCU_UPDATE_INTERNAL_FAILED,
                    e.getMessage() != null ? e.getMessage() : e.getClass().getSimpleName()));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(errorResponse)
                .build();
        }
    }

    @OPTIONS
    @Path("/{id}")
    public Response optionsDelete(@PathParam("id") Long id) {
        return Response.ok()
            .header("Access-Control-Allow-Origin", "*")
            .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
            .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
            .build();
    }

    @DELETE @Path("/{id}")
    @Produces(MediaType.APPLICATION_JSON)
    public Response delete(@PathParam("id") Long id) {
        try {
            // Soft delete - inativar ao invés de deletar fisicamente
            FcuDto inactivated = service.delete(id);
            java.util.Map<String, Object> response = new java.util.HashMap<>();
            response.put("success", true);
            response.put("message", ApiI18nMessages.encode(ApiI18nMessages.FCU_DEACTIVATED));
            response.put("fcu", inactivated);
            return Response.ok()
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .entity(response)
                .build();
        } catch (IllegalArgumentException e) {
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", ApiI18nMessages.messageOrFallback(
                    ApiI18nMessages.FCU_DEACTIVATE_FAILED, e.getMessage()));
            return Response.status(Response.Status.BAD_REQUEST)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .entity(errorResponse)
                .build();
        } catch (RuntimeException e) {
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", ApiI18nMessages.messageOrFallback(
                    ApiI18nMessages.FCU_DEACTIVATE_FAILED, e.getMessage()));
            return Response.status(Response.Status.BAD_REQUEST)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .entity(errorResponse)
                .build();
        } catch (Exception e) {
            java.util.Map<String, String> errorResponse = new java.util.HashMap<>();
            errorResponse.put("error", ApiI18nMessages.messageOrFallback(
                    ApiI18nMessages.FCU_DEACTIVATE_FAILED, e.getMessage()));
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "DELETE, OPTIONS, GET, POST, PUT")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization")
                .entity(errorResponse)
                .build();
        }
    }
}
