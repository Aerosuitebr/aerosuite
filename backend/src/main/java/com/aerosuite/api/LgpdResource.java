package com.aerosuite.api;

import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.*;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.LgpdService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.core.StreamingOutput;
import java.io.IOException;
import java.nio.file.Files;
import java.util.List;

@Path("/api/lgpd")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class LgpdResource {

    @Inject
    LgpdService lgpdService;
    @Inject
    InternalUserContext internalUserContext;

    @GET
    @Path("/status")
    public LgpdStatusDto status() {
        return lgpdService.statusForUsuario(requireUser());
    }

    @POST
    @Path("/aceite")
    public Response aceite(LgpdAceiteRequest request, @Context ContainerRequestContext ctx) {
        String ip = ctx.getHeaderString("X-Forwarded-For");
        if (ip == null) {
            ip = ctx.getHeaderString("X-Real-IP");
        }
        lgpdService.registrarAceite(requireUser(), request, ip, ctx.getHeaderString("User-Agent"));
        return Response.ok().build();
    }

    @GET
    @Path("/solicitacoes")
    public List<LgpdSolicitacaoDto> solicitacoes() {
        return lgpdService.listarMinhasSolicitacoes(internalUserContext.getUserId());
    }

    @POST
    @Path("/solicitacoes")
    public LgpdSolicitacaoDto criarSolicitacao(LgpdSolicitacaoRequest request) {
        return lgpdService.criarSolicitacao(requireUser(), request);
    }

    @GET
    @Path("/solicitacoes/{id}/download")
    @Produces("application/json")
    public Response downloadExport(@PathParam("id") long id) {
        try {
            java.nio.file.Path file = lgpdService.resolveExportFile(id, internalUserContext.getUserId());
            StreamingOutput stream = output -> Files.copy(file, output);
            return Response.ok(stream)
                    .header("Content-Disposition", "attachment; filename=\"" + file.getFileName() + "\"")
                    .build();
        } catch (IOException e) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_FILE_UNAVAILABLE));
        }
    }

    private Usuario requireUser() {
        Integer uid = internalUserContext.getUserId();
        if (uid == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_NOT_AUTHENTICATED));
        }
        Usuario u = Usuario.findById(uid);
        if (u == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.LGPD_USER_NOT_FOUND));
        }
        return u;
    }
}
