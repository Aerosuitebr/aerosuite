package com.aerosuite.api;

import com.aerosuite.dto.AssociacaoFcuDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.AssociacaoFcuService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/api/associacao-fcu")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@RequiresFuncionalidades(allOf = {"ASSOCIACAO_FCU"})
public class AssociacaoFcuResource {

    @Inject
    AssociacaoFcuService service;

    @GET
    public Response search(
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("10") Integer size,
            @QueryParam("sort") String sort,
            @QueryParam("q") String q,
            @QueryParam("idFcu") Long idFcu,
            @QueryParam("isActive") String isActiveParam) {
        
        // Converter string para Boolean (null = true por padrão para filtrar apenas ativos)
        Boolean isActive = null;
        if (isActiveParam != null && !isActiveParam.isBlank()) {
            isActive = Boolean.parseBoolean(isActiveParam);
        }
        
        var result = service.search(page, size, sort, q, idFcu, isActive);
        return Response.ok(result).build();
    }

    @GET
    @Path("/fcu/{idFcu}")
    public Response getByFcuId(@PathParam("idFcu") Long idFcu) {
        List<AssociacaoFcuDto> associations = service.getByFcuId(idFcu);
        return Response.ok(associations).build();
    }

    @GET
    @Path("/available-products")
    public Response getAvailableProducts(
            @QueryParam("idFcu") Long idFcu,
            @QueryParam("search") String search) {
        try {
            if (idFcu == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.ASSOCIACAO_FCU_ID_REQUIRED)))
                        .build();
            }
            var products = service.getAvailableProducts(idFcu, search);
            return Response.ok(products).build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.ASSOCIACAO_FCU_FETCH_PRODUCTS_FAILED, e.getMessage())))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.ASSOCIACAO_FCU_FETCH_PRODUCTS_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    public Response create(AssociacaoFcuDto dto) {
        AssociacaoFcuDto created = service.create(dto);
        return Response.status(Response.Status.CREATED).entity(created).build();
    }

    @PUT
    @Path("/{id}")
    public Response update(@PathParam("id") Integer id, AssociacaoFcuDto dto) {
        // Se o body contém isActive=false, fazer soft delete
        if (dto.isActive != null && !dto.isActive) {
            AssociacaoFcuDto inactivated = service.inactivate(id);
            return Response.ok(inactivated).build();
        }
        // Caso contrário, atualizar normalmente
        AssociacaoFcuDto updated = service.update(id, dto);
        return Response.ok(updated).build();
    }

    @DELETE
    @Path("/{id}")
    public Response delete(@PathParam("id") Integer id) {
        // Soft delete - inativar ao invés de deletar fisicamente
        AssociacaoFcuDto inactivated = service.delete(id);
        return Response.ok(inactivated).build();
    }

    @DELETE
    @Path("/fcu/{idFcu}/product/{idProduct}")
    public Response deleteByFcuAndProduct(
            @PathParam("idFcu") Long idFcu,
            @PathParam("idProduct") Integer idProduct) {
        service.deleteByFcuAndProduct(idFcu, idProduct);
        return Response.noContent().build();
    }

    @POST
    @Path("/associate")
    public Response associateProducts(
            @QueryParam("idFcu") Long idFcu,
            @QueryParam("defaultQuantity") @DefaultValue("1") Integer defaultQuantity,
            List<Integer> productIds) {
        service.associateProducts(idFcu, productIds, defaultQuantity);
        return Response.ok().build();
    }
}
