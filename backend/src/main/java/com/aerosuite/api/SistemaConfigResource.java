package com.aerosuite.api;

import com.aerosuite.dto.sistema.SistemaConfigDto;
import com.aerosuite.dto.sistema.SistemaConfigWriteDto;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PermissionProfileService;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.SistemaConfigService;
import com.aerosuite.service.SistemaEmpresaConfigService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Map;

@Path("/api/sistema-config")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class SistemaConfigResource {

    @Inject
    SistemaConfigService sistemaConfigService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    PermissionProfileService permissionProfileService;

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    String superPerfilCodigosRaw;

    @GET
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public Response get() {
        if (!canManageAdminConfig()) {
            return forbidden();
        }
        return Response.ok(sistemaConfigService.getForCurrentTenant()).build();
    }

    @PUT
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public Response put(SistemaConfigWriteDto body) {
        if (!canManageAdminConfig()) {
            return forbidden();
        }
        Integer uid = internalUserContext.getUserId();
        if (uid == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        try {
            SistemaConfigDto saved = sistemaConfigService.upsert(body, uid);
            return Response.ok(saved).build();
        } catch (BadRequestException e) {
            String msg = e.getMessage() != null ? e.getMessage() : "sistema.config.error.requisicao_invalida";
            return Response.status(Response.Status.BAD_REQUEST).entity(Map.of("error", msg)).build();
        }
    }

    private void ensurePermissionSnapshot() {
        if (internalUserContext.isPermissionsHydrated()) {
            return;
        }
        Integer uid = internalUserContext.getUserId();
        if (uid == null) {
            return;
        }
        PermissionProfileService.PermissionSnapshot snap = permissionProfileService.loadSnapshot(uid);
        internalUserContext.applyPermissionSnapshot(snap.perfilCodigo(), snap.funcionalidadeCodigos());
    }

    private boolean isSuperPerfil() {
        ensurePermissionSnapshot();
        return SistemaEmpresaConfigService.isSuperPerfil(
                internalUserContext.getPerfilCodigo(), superPerfilCodigosRaw);
    }

    private boolean canManageAdminConfig() {
        ensurePermissionSnapshot();
        if (isSuperPerfil()) {
            return true;
        }
        return internalUserContext.hasFuncionalidadeCodigo("CONFIGURACOES")
                || internalUserContext.hasFuncionalidadeCodigo("GERENCIAR_PERMISSOES");
    }

    private static Response forbidden() {
        return Response.status(Response.Status.FORBIDDEN)
                .entity(Map.of("error", "sistema.config.error.sem_permissao"))
                .build();
    }
}
