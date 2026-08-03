package com.aerosuite.api;

import com.aerosuite.domain.Notificacao;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.NotificacaoService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/api/notificacoes")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class NotificacaoResource {

    @Inject
    NotificacaoService service;

    @GET
    public Response listar(
            @QueryParam("usuarioId") Long usuarioId,
            @QueryParam("page") @DefaultValue("0") Integer page,
            @QueryParam("size") @DefaultValue("20") Integer size,
            @QueryParam("apenasNaoLidas") @DefaultValue("false") Boolean apenasNaoLidas) {
        
        if (usuarioId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.NOTIFICATION_USUARIO_ID_REQUIRED)))
                .build();
        }
        
        List<Notificacao> notificacoes;
        if (apenasNaoLidas) {
            notificacoes = service.buscarNaoLidas(usuarioId);
        } else {
            notificacoes = service.buscarTodas(usuarioId, page, size);
        }
        
        long naoLidas = service.contarNaoLidas(usuarioId);
        
        return Response.ok(Map.of(
            "items", notificacoes,
            "naoLidas", naoLidas
        )).build();
    }

    @GET
    @Path("/count")
    public Response contarNaoLidas(@QueryParam("usuarioId") Long usuarioId) {
        if (usuarioId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.NOTIFICATION_USUARIO_ID_REQUIRED)))
                .build();
        }
        
        long count = service.contarNaoLidas(usuarioId);
        return Response.ok(Map.of("count", count)).build();
    }

    @PUT
    @Path("/{id}/lida")
    public Response marcarComoLida(@PathParam("id") Long id) {
        service.marcarComoLida(id);
        return Response.ok(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.NOTIFICATION_MARKED_READ)))
                .build();
    }

    @PUT
    @Path("/marcar-todas-lidas")
    public Response marcarTodasComoLidas(@QueryParam("usuarioId") Long usuarioId) {
        if (usuarioId == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.NOTIFICATION_USUARIO_ID_REQUIRED)))
                .build();
        }
        
        service.marcarTodasComoLidas(usuarioId);
        return Response.ok(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.NOTIFICATION_ALL_MARKED_READ)))
                .build();
    }

    @DELETE
    @Path("/{id}")
    public Response deletar(@PathParam("id") Long id) {
        service.deletar(id);
        return Response.noContent().build();
    }
}
