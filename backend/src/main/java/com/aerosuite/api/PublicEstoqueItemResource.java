package com.aerosuite.api;

import com.aerosuite.dto.ItemEstoquePublicPeekDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.EstoquePublicConsultaService;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.QueryParam;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.Map;

/**
 * Consulta pública de item de estoque (QR da etiqueta — sem JWT).
 */
@Path("/api/public/estoque")
@Produces(MediaType.APPLICATION_JSON)
public class PublicEstoqueItemResource {

    @Inject
    EstoquePublicConsultaService publicConsultaService;

    @GET
    @Path("/item")
    public Response consultarItem(
            @QueryParam("tenant") String tenantCodigo,
            @QueryParam("codigo") String codigo) {
        try {
            ItemEstoquePublicPeekDto dto = publicConsultaService.consultarPorCodigo(tenantCodigo, codigo);
            return Response.ok(dto).build();
        } catch (NotFoundException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("error", ApiI18nMessages.messageOrFallback(
                            ApiI18nMessages.ESTOQUE_ITEM_NOT_FOUND, e.getMessage())))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of("error", ApiI18nMessages.withDetail(
                            ApiI18nMessages.ESTOQUE_PUBLIC_QUERY_FAILED, e.getMessage())))
                    .build();
        }
    }
}
