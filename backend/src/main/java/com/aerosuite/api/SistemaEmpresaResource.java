package com.aerosuite.api;

import com.aerosuite.dto.sistema.SistemaEmpresaConfigDto;
import com.aerosuite.dto.sistema.SistemaEmpresaConfigWriteDto;
import com.aerosuite.dto.sistema.SistemaEmpresaStatusDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PermissionProfileService;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.service.EmpresaAssetService;
import com.aerosuite.service.SistemaEmpresaConfigService;
import jakarta.inject.Inject;
import jakarta.ws.rs.Consumes;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.PUT;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.nio.file.Files;
import java.util.Map;

/**
 * Configuração da empresa detentora do sistema (autenticado).
 */
@Path("/api/sistema-empresa")
@Produces(MediaType.APPLICATION_JSON)
public class SistemaEmpresaResource {

    private static final long MAX_IMAGE_BYTES = 4 * 1024 * 1024;

    @Inject
    SistemaEmpresaConfigService sistemaEmpresaConfigService;

    @Inject
    EmpresaAssetService empresaAssetService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    PermissionProfileService permissionProfileService;

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    String superPerfilCodigosRaw;

    @GET
    @Path("/status")
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public SistemaEmpresaStatusDto status() {
        SistemaEmpresaStatusDto s = sistemaEmpresaConfigService.status(canManageEmpresaConfig());
        s.canPublish = isSuperPerfil();
        return s;
    }

    @GET
    @Path("/config")
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public SistemaEmpresaConfigDto getConfig() {
        return sistemaEmpresaConfigService.getFullConfig();
    }

    @PUT
    @Path("/config")
    @Consumes(MediaType.APPLICATION_JSON)
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public Response putConfig(SistemaEmpresaConfigWriteDto body) {
        if (!canManageEmpresaConfig()) {
            return forbidden();
        }
        if (body != null && Boolean.TRUE.equals(body.concluirOnboarding) && !isSuperPerfil()) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_ONBOARDING_ADMIN_ONLY)))
                    .build();
        }
        Integer uid = internalUserContext.getUserId();
        if (uid == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        try {
            SistemaEmpresaConfigDto saved = sistemaEmpresaConfigService.upsert(body, uid);
            return Response.ok(saved).build();
        } catch (jakarta.ws.rs.BadRequestException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.COMMON_BAD_REQUEST, e.getMessage())))
                    .build();
        }
    }

    @POST
    @Path("/logo")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public Response uploadLogo(@RestForm("file") FileUpload file) {
        return uploadBrandImage(file, true);
    }

    @POST
    @Path("/wordmark")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public Response uploadWordmark(@RestForm("file") FileUpload file) {
        return uploadBrandImage(file, false);
    }

    private Response uploadBrandImage(FileUpload file, boolean logo) {
        if (!canManageEmpresaConfig()) {
            return forbidden();
        }
        try {
            if (file == null || file.uploadedFile() == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_FILE_REQUIRED)))
                        .build();
            }
            long size = Files.size(file.uploadedFile());
            if (size > MAX_IMAGE_BYTES) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_IMAGE_TOO_LARGE)))
                        .build();
            }
            String ct = file.contentType();
            if (ct == null || !ct.startsWith("image/")) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_IMAGE_ONLY)))
                        .build();
            }
            String url = logo
                    ? empresaAssetService.saveLogoForTenant(tenantDataAccess.currentTenantId(), file)
                    : empresaAssetService.saveWordmarkForTenant(tenantDataAccess.currentTenantId(), file);
            if (logo) {
                sistemaEmpresaConfigService.updateStoredLogoUrl(url);
            } else {
                sistemaEmpresaConfigService.updateStoredWordmarkUrl(url);
            }
            return Response.ok(Map.of("url", url)).build();
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of(
                            "message",
                            ApiI18nMessages.messageOrFallback(
                                    ApiI18nMessages.EMPRESA_UPLOAD_FAILED, e.getMessage())))
                    .build();
        }
    }

    /**
     * Endpoints com {@code onlyAuthenticated} não passam pelo filtro de permissões;
     * hidrata perfil + funcionalidades antes de avaliar {@code canEdit} / PUT.
     */
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

    /** Super perfil ou funcionalidade Configurações / Gerir permissões. */
    private boolean canManageEmpresaConfig() {
        ensurePermissionSnapshot();
        if (isSuperPerfil()) {
            return true;
        }
        return internalUserContext.hasFuncionalidadeCodigo("CONFIGURACOES")
                || internalUserContext.hasFuncionalidadeCodigo("GERENCIAR_PERMISSOES");
    }

    private static Response forbidden() {
        return Response.status(Response.Status.FORBIDDEN)
                .entity(Map.of("message", ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_FORBIDDEN)))
                .build();
    }
}
