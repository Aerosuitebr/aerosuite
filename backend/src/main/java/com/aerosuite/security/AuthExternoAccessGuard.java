package com.aerosuite.security;

import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.Response;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Arrays;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Garante que endpoints {@code /api/auth-externo/me/*} só são acedidos pelo próprio
 * utilizador externo (token {@code EXT:}) ou por utilizador interno com permissão de gestão.
 */
@ApplicationScoped
public class AuthExternoAccessGuard {

    private static final String[] MANAGE_EXTERNOS = {
            "USUARIOS_EXTERNOS", "usuarios-externos", "GERENCIAR_PERMISSOES"
    };

    @Inject
    AuthRequestAttributes authRequestAttributes;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    PermissionProfileService permissionProfileService;

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    String superPerfilCodigosRaw;

    public void assertCanAccessUsuarioExterno(Integer targetUsuarioExternoId) {
        if (targetUsuarioExternoId == null) {
            throw forbidden(ApiI18nMessages.encode(ApiI18nMessages.COMMON_FORBIDDEN));
        }
        if (authRequestAttributes.isExternalLegacyToken()) {
            Integer self = authRequestAttributes.getExternalUserId();
            if (self == null || !self.equals(targetUsuarioExternoId)) {
                throw forbidden(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_OTHER_USER_DATA));
            }
            return;
        }
        if (!internalUserContext.isAuthenticated() || internalUserContext.getUserId() == null) {
            throw forbidden(ApiI18nMessages.encode(ApiI18nMessages.COMMON_NOT_AUTHENTICATED));
        }
        PermissionProfileService.PermissionSnapshot snap =
                permissionProfileService.loadSnapshot(internalUserContext.getUserId());
        if (isSuperPerfil(snap.perfilCodigo())) {
            return;
        }
        Set<String> userCanon = FuncionalidadeCodigoNormalizer.canonSet(snap.funcionalidadeCodigos());
        if (FuncionalidadeCodigoNormalizer.userHasAny(userCanon, MANAGE_EXTERNOS)) {
            return;
        }
        throw forbidden(ApiI18nMessages.encode(ApiI18nMessages.EXTERNO_MANAGE_PERMISSION));
    }

    private static WebApplicationException forbidden(String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("message", message);
        return new WebApplicationException(
                Response.status(Response.Status.FORBIDDEN)
                        .entity(body)
                        .type("application/json")
                        .build());
    }

    private boolean isSuperPerfil(String perfilCodigo) {
        if (perfilCodigo == null || perfilCodigo.isBlank()) {
            return false;
        }
        String normalized = perfilCodigo.trim();
        return Arrays.stream(superPerfilCodigosRaw.split(","))
                .map(s -> s.trim().toUpperCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .anyMatch(s -> s.equals(normalized.toUpperCase(Locale.ROOT)));
    }
}
