package com.aerosuite.security;

import com.aerosuite.p1.TenantFeatureCatalog;
import com.aerosuite.service.TenantFeatureService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.lang.reflect.Method;
import java.util.Arrays;

/**
 * Autorização por feature flag de tenant ({@link RequiresTenantFeature}).
 */
@Provider
@Priority(Priorities.AUTHORIZATION + 1)
public class TenantFeatureAuthorizationFilter implements ContainerRequestFilter {

    @Inject
    ResourceInfo resourceInfo;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    TenantFeatureService tenantFeatureService;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        RequiresTenantFeature methodSpec = resolveMethodAnnotation();
        RequiresTenantFeature classSpec = resolveClassAnnotation();

        boolean methodNonEmpty = methodSpec != null && !isEmpty(methodSpec);
        boolean classNonEmpty = classSpec != null && !isEmpty(classSpec);
        if (!methodNonEmpty && !classNonEmpty) {
            return;
        }

        if (!internalUserContext.isAuthenticated() || internalUserContext.getTenantId() == null) {
            abort(requestContext, Response.Status.UNAUTHORIZED, "Não autenticado");
            return;
        }

        long tenantId = internalUserContext.getTenantId();

        if (classNonEmpty && !authorize(requestContext, classSpec, tenantId)) {
            return;
        }
        if (methodNonEmpty && !authorize(requestContext, methodSpec, tenantId)) {
            return;
        }
    }

    private boolean authorize(
            ContainerRequestContext requestContext, RequiresTenantFeature spec, long tenantId) {
        for (String code : spec.allOf()) {
            if (code == null || code.isBlank()) {
                continue;
            }
            String normalized = TenantFeatureCatalog.normalizeCode(code);
            if (!tenantFeatureService.isEnabled(tenantId, normalized)) {
                abort(
                        requestContext,
                        Response.Status.FORBIDDEN,
                        "Funcionalidade não habilitada para esta organização: " + normalized);
                return false;
            }
        }

        if (spec.anyOf().length > 0) {
            boolean any = Arrays.stream(spec.anyOf())
                    .filter(c -> c != null && !c.isBlank())
                    .anyMatch(c -> tenantFeatureService.isEnabled(tenantId, TenantFeatureCatalog.normalizeCode(c)));
            if (!any) {
                abort(
                        requestContext,
                        Response.Status.FORBIDDEN,
                        "Nenhuma feature flag exigida está habilitada para esta organização");
                return false;
            }
        }
        return true;
    }

    private RequiresTenantFeature resolveMethodAnnotation() {
        Method method = resourceInfo.getResourceMethod();
        if (method != null && method.isAnnotationPresent(RequiresTenantFeature.class)) {
            return method.getAnnotation(RequiresTenantFeature.class);
        }
        return null;
    }

    private RequiresTenantFeature resolveClassAnnotation() {
        Class<?> c = resourceInfo.getResourceClass();
        while (c != null) {
            if (c.isAnnotationPresent(RequiresTenantFeature.class)) {
                return c.getAnnotation(RequiresTenantFeature.class);
            }
            c = c.getSuperclass();
        }
        return null;
    }

    private static boolean isEmpty(RequiresTenantFeature spec) {
        return spec.allOf().length == 0 && spec.anyOf().length == 0;
    }

    private void abort(ContainerRequestContext ctx, Response.Status status, String message) {
        String safe = message == null ? "" : message.replace("\"", "'");
        ctx.abortWith(Response.status(status)
                .entity("{\"message\":\"" + safe + "\"}")
                .type("application/json")
                .build());
    }
}
