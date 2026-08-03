package com.aerosuite.security;

import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.ResourceInfo;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import java.lang.reflect.Method;
import java.time.Instant;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@Provider
@Priority(Priorities.AUTHORIZATION)
public class PlatformOpsAuthorizationFilter implements ContainerRequestFilter {

    @Inject
    ResourceInfo resourceInfo;

    @Inject
    InternalUserContext internalUserContext;

    @ConfigProperty(name = "aero.suite.platform.ops.mfa-required", defaultValue = "true")
    boolean platformOpsMfaRequired;

    @ConfigProperty(name = "aero.suite.platform.ops.mfa-revalidate-minutes", defaultValue = "30")
    int mfaRevalidateMinutes;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        if (!requiresPlatformOps()) {
            return;
        }
        if (!internalUserContext.isAuthenticated()) {
            abort(requestContext, Response.Status.UNAUTHORIZED, ApiI18nMessages.PLATFORM_OPS_FORBIDDEN);
            return;
        }
        if (!internalUserContext.isPlatformOpsElevated()) {
            abort(requestContext, Response.Status.FORBIDDEN, ApiI18nMessages.PLATFORM_OPS_FORBIDDEN);
            return;
        }
        if (platformOpsMfaRequired && isMfaStale()) {
            abort(requestContext, Response.Status.FORBIDDEN, ApiI18nMessages.PLATFORM_OPS_MFA_STALE);
        }
    }

    private boolean isMfaStale() {
        Long mfaAt = internalUserContext.getPlatformOpsMfaAtEpochSec();
        if (mfaAt == null || mfaAt <= 0) {
            return true;
        }
        long maxAgeSec = Math.max(5, mfaRevalidateMinutes) * 60L;
        return Instant.now().getEpochSecond() - mfaAt > maxAgeSec;
    }

    private boolean requiresPlatformOps() {
        Method method = resourceInfo.getResourceMethod();
        if (method != null && method.isAnnotationPresent(RequiresPlatformOps.class)) {
            return true;
        }
        Class<?> clazz = resourceInfo.getResourceClass();
        return clazz != null && clazz.isAnnotationPresent(RequiresPlatformOps.class);
    }

    private static void abort(ContainerRequestContext ctx, Response.Status status, String messageKey) {
        String code = ApiI18nMessages.PLATFORM_OPS_MFA_STALE.equals(messageKey)
                ? "PLATFORM_OPS_MFA_STALE"
                : "PLATFORM_OPS_FORBIDDEN";
        ctx.abortWith(Response.status(status)
                .entity("{\"code\":\"" + code + "\",\"message\":\"" + ApiI18nMessages.encode(messageKey) + "\"}")
                .type("application/json")
                .build());
    }
}
