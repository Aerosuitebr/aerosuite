package com.aerosuite.api;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.dto.OsNotificacaoDeficitTrocaDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.OsNotificacaoDeficitTrocaService;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.HttpHeaders;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;

import java.util.List;
import java.util.Map;

@Path("/api/notificacoes/trocas-deficit")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@ApplicationScoped
@RequiresFuncionalidades(allOf = {"ORDEM_SERVICO"})
public class OsNotificacaoDeficitTrocaResource {

    @Inject
    OsNotificacaoDeficitTrocaService service;

    @GET
    @Path("/pendentes")
    public Response listarPendentes(@Context HttpHeaders headers) {
        AuditoriaUsuarioContext ctx = AuditoriaUsuarioContext.from(headers, null, null);
        if (ctx.userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.COMMON_NOT_AUTHENTICATED)))
                    .build();
        }
        if (!service.usuarioRecebeNotificacaoDeficitTroca(ctx.userId)) {
            return Response.ok(List.of()).build();
        }
        List<OsNotificacaoDeficitTrocaDto> list = service.listarPendentesParaUsuario(ctx.userId);
        return Response.ok(list).build();
    }

    @POST
    @Path("/{id}/ciente")
    public Response marcarCiente(@PathParam("id") long id, @Context HttpHeaders headers) {
        AuditoriaUsuarioContext ctx = AuditoriaUsuarioContext.from(headers, null, null);
        if (ctx.userId == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.COMMON_NOT_AUTHENTICATED)))
                    .build();
        }
        if (!service.usuarioRecebeNotificacaoDeficitTroca(ctx.userId)) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.COMMON_FORBIDDEN)))
                    .build();
        }
        boolean ok = service.marcarCiente(id, ctx.userId);
        if (!ok) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.NOTIFICATION_DEFICIT_NOT_FOUND)))
                    .build();
        }
        return Response.noContent().build();
    }
}
