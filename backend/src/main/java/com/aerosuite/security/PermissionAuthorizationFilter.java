package com.aerosuite.security;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.lang.reflect.Method;
import java.util.Arrays;
import java.util.HashSet;
import java.util.Locale;
import java.util.Set;

/**
 * Autorização declarativa via {@link RequiresFuncionalidades}. Corre após autenticação JWT.
 * <p>
 * Quando existem anotações na classe <strong>e</strong> no método JAX-RS, <strong>ambas</strong>
 * são aplicadas em sequência (intersecção): reforço contra métodos novos sem política explícita.
 */
@Provider
@Priority(Priorities.AUTHORIZATION)
public class PermissionAuthorizationFilter implements ContainerRequestFilter {

    @Inject
    ResourceInfo resourceInfo;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    AuthRequestAttributes authRequestAttributes;

    @Inject
    PermissionProfileService permissionProfileService;

    @Inject
    com.aerosuite.service.AccessAuditService accessAuditService;

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    String superPerfilCodigosRaw;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        RequiresFuncionalidades methodSpec = resolveMethodAnnotation();
        RequiresFuncionalidades classSpec = resolveClassAnnotation();

        boolean methodNonEmpty = methodSpec != null && !isAnnotationEmpty(methodSpec);
        boolean classNonEmpty = classSpec != null && !isAnnotationEmpty(classSpec);
        if (!methodNonEmpty && !classNonEmpty) {
            return;
        }

        boolean externalAllowedOnMethod = methodNonEmpty && methodSpec.allowExternalLegacy();
        boolean externalAllowedOnClass = classNonEmpty && classSpec.allowExternalLegacy();
        boolean externalLegacy = authRequestAttributes.isExternalLegacyToken();

        if (externalLegacy) {
            if (classNonEmpty && !classSpec.allowExternalLegacy()) {
                abort(requestContext, Response.Status.FORBIDDEN, "Acesso reservado a usuários internos", null);
                return;
            }
            if (methodNonEmpty && !methodSpec.allowExternalLegacy()) {
                abort(requestContext, Response.Status.FORBIDDEN, "Acesso reservado a usuários internos", null);
                return;
            }
            if (externalAllowedOnMethod && isOnlyAuthenticatedSpec(methodSpec)) {
                return;
            }
            if (!methodNonEmpty && externalAllowedOnClass && isOnlyAuthenticatedSpec(classSpec)) {
                return;
            }
        }

        if (!internalUserContext.isAuthenticated() || internalUserContext.getUserId() == null) {
            abort(requestContext, Response.Status.UNAUTHORIZED, "Não autenticado", "NOT_AUTHENTICATED");
            return;
        }

        boolean needsSnapshot = requiresPermissionSnapshot(methodSpec, methodNonEmpty)
                || requiresPermissionSnapshot(classSpec, classNonEmpty);
        PermissionProfileService.PermissionSnapshot snap;
        if (needsSnapshot) {
            snap = permissionProfileService.loadSnapshot(internalUserContext.getUserId());
            internalUserContext.applyPermissionSnapshot(snap.perfilCodigo(), snap.funcionalidadeCodigos());
        } else {
            snap = new PermissionProfileService.PermissionSnapshot(null, Set.of());
        }

        if (needsSnapshot && isSuperPerfil(snap.perfilCodigo())) {
            return;
        }

        Set<String> userCodes = needsSnapshot
                ? normalizedFuncionalidadeCodes(snap.funcionalidadeCodigos())
                : Set.of();

        if (classNonEmpty) {
            if (!authorize(requestContext, classSpec, userCodes)) {
                return;
            }
        }
        if (methodNonEmpty) {
            if (!authorize(requestContext, methodSpec, userCodes)) {
                return;
            }
        }
    }

    private boolean authorize(
            ContainerRequestContext requestContext,
            RequiresFuncionalidades spec,
            Set<String> userCodes
    ) {
        if (spec.onlyAuthenticated()) {
            return true;
        }

        Set<String> userCanon = FuncionalidadeCodigoNormalizer.canonSet(userCodes);

        for (String code : spec.allOf()) {
            if (code == null || code.isBlank()) {
                continue;
            }
            if (!userCanon.contains(FuncionalidadeCodigoNormalizer.canon(code))) {
                abort(requestContext, Response.Status.FORBIDDEN, "Permissão em falta: " + code, null);
                return false;
            }
        }

        if (spec.anyOf().length > 0 && !FuncionalidadeCodigoNormalizer.userHasAny(userCanon, spec.anyOf())) {
            abort(requestContext, Response.Status.FORBIDDEN, "Nenhuma das permissões requeridas (anyOf)", null);
            return false;
        }

        if (spec.anyCodigoStartingWith().length > 0 && !matchesAnyPrefix(userCodes, spec.anyCodigoStartingWith())) {
            abort(requestContext, Response.Status.FORBIDDEN, "Nenhuma permissão na família de códigos requerida", null);
            return false;
        }
        return true;
    }

    private RequiresFuncionalidades resolveMethodAnnotation() {
        Method method = resourceInfo.getResourceMethod();
        if (method != null && method.isAnnotationPresent(RequiresFuncionalidades.class)) {
            return method.getAnnotation(RequiresFuncionalidades.class);
        }
        return null;
    }

    private RequiresFuncionalidades resolveClassAnnotation() {
        Class<?> c = resourceInfo.getResourceClass();
        while (c != null) {
            if (c.isAnnotationPresent(RequiresFuncionalidades.class)) {
                return c.getAnnotation(RequiresFuncionalidades.class);
            }
            c = c.getSuperclass();
        }
        return null;
    }

    private static boolean isAnnotationEmpty(RequiresFuncionalidades spec) {
        return !spec.onlyAuthenticated()
                && spec.allOf().length == 0
                && spec.anyOf().length == 0
                && spec.anyCodigoStartingWith().length == 0;
    }

    private static boolean isOnlyAuthenticatedSpec(RequiresFuncionalidades spec) {
        return spec != null
                && spec.onlyAuthenticated()
                && spec.allOf().length == 0
                && spec.anyOf().length == 0
                && spec.anyCodigoStartingWith().length == 0;
    }

    /** {@code onlyAuthenticated} sem allOf/anyOf não precisa de Hibernate no filtro (ex.: /meu-menu). */
    private static boolean requiresPermissionSnapshot(RequiresFuncionalidades spec, boolean nonEmpty) {
        if (!nonEmpty || spec == null) {
            return false;
        }
        return spec.allOf().length > 0
                || spec.anyOf().length > 0
                || spec.anyCodigoStartingWith().length > 0
                || !spec.onlyAuthenticated();
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

    private static Set<String> normalizedFuncionalidadeCodes(Set<String> raw) {
        Set<String> out = new HashSet<>();
        if (raw == null) {
            return out;
        }
        for (String c : raw) {
            if (c != null && !c.isBlank()) {
                out.add(c.trim().toUpperCase(Locale.ROOT));
            }
        }
        return out;
    }

    private static boolean matchesAnyPrefix(Set<String> userCodesUpper, String[] prefixes) {
        for (String userCode : userCodesUpper) {
            if (userCode == null) {
                continue;
            }
            for (String prefix : prefixes) {
                if (prefix == null || prefix.isBlank()) {
                    continue;
                }
                String p = prefix.trim().toUpperCase(Locale.ROOT);
                if (userCode.equals(p) || userCode.startsWith(p + "_")) {
                    return true;
                }
            }
        }
        return false;
    }

    private void abort(ContainerRequestContext ctx, Response.Status status, String message, String auditCode) {
        String path = ctx.getUriInfo() != null ? ctx.getUriInfo().getPath() : null;
        String ip = ctx.getHeaderString("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = ctx.getHeaderString("X-Real-IP");
        }
        String userAgent = ctx.getHeaderString("User-Agent");
        if (status == Response.Status.FORBIDDEN && internalUserContext.isAuthenticated()) {
            accessAuditService.rbacDenied(
                    internalUserContext.getTenantId(),
                    internalUserContext.getUserId(),
                    internalUserContext.getEmail(),
                    message,
                    ip,
                    userAgent,
                    path);
        } else if (status == Response.Status.UNAUTHORIZED) {
            accessAuditService.authUnauthorized(
                    auditCode != null ? auditCode : message,
                    ip,
                    userAgent,
                    path);
        }
        String safe = message == null ? "" : message.replace("\"", "'");
        ctx.abortWith(Response.status(status)
                .entity("{\"message\":\"" + safe + "\"}")
                .type("application/json")
                .build());
    }
}
