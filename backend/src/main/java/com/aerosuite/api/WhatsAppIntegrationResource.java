package com.aerosuite.api;

import com.aerosuite.integration.evolution.EvolutionService;
import com.aerosuite.integration.evolution.dto.TenantWhatsAppConnectionViewDto;
import com.aerosuite.integration.evolution.dto.WhatsAppQrCodeDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PermissionProfileService;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.SistemaEmpresaConfigService;
import jakarta.inject.Inject;
import jakarta.ws.rs.DELETE;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.POST;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.Map;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Gestão da integração WhatsApp (Evolution API) por tenant.
 */
@Path("/api/integracoes/whatsapp")
@Produces(MediaType.APPLICATION_JSON)
@RequiresFuncionalidades(onlyAuthenticated = true)
public class WhatsAppIntegrationResource {

    @Inject
    EvolutionService evolutionService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    PermissionProfileService permissionProfileService;

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    String superPerfilCodigosRaw;

    @GET
    @Path("/status")
    public TenantWhatsAppConnectionViewDto status() {
        return evolutionService.getConnectionView(canManage());
    }

    @POST
    @Path("/activate")
    public Response activate() {
        if (!canManage()) {
            return forbidden();
        }
        try {
            TenantWhatsAppConnectionViewDto view = evolutionService.activateWhatsApp();
            return Response.ok(view).build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/qrcode")
    public Response qrcode() {
        if (!canManage()) {
            return forbidden();
        }
        try {
            WhatsAppQrCodeDto dto = evolutionService.fetchQrCode();
            return Response.ok(dto).build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    @DELETE
    @Path("/disconnect")
    public Response disconnect() {
        if (!canManage()) {
            return forbidden();
        }
        try {
            evolutionService.disconnect();
            return Response.ok(Map.of("ok", true)).build();
        } catch (IllegalStateException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(Map.of("error", e.getMessage()))
                    .build();
        }
    }

    private boolean canManage() {
        ensurePermissionSnapshot();
        return SistemaEmpresaConfigService.isSuperPerfil(
                internalUserContext.getPerfilCodigo(), superPerfilCodigosRaw);
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

    private static Response forbidden() {
        return Response.status(Response.Status.FORBIDDEN)
                .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_ADMIN_ONLY)))
                .build();
    }
}
