package com.aerosuite.security;

import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;

/**
 * Limita taxa de pedidos anónimos em {@code /api/public/*} (signup, branding, LGPD, etc.).
 */
@Provider
@PreMatching
@Priority(Priorities.AUTHENTICATION - 50)
public class PublicApiRateLimitFilter implements ContainerRequestFilter {

    @Inject
    PublicApiRateLimiter rateLimiter;

    @Override
    public void filter(ContainerRequestContext ctx) {
        if (!rateLimiter.isEnabled()) {
            return;
        }
        if ("OPTIONS".equalsIgnoreCase(ctx.getMethod())) {
            return;
        }
        String path = ctx.getUriInfo().getPath();
        if (path == null || !path.startsWith("/api/public/")) {
            return;
        }
        String prefix = publicPathPrefix(path);
        String clientKey = clientKey(ctx);
        PublicApiRateLimiter.RateLimitDecision d = rateLimiter.tryAcquire(clientKey, prefix);
        if (d.granted()) {
            if (d.limit() > 0) {
                ctx.getHeaders().putSingle("X-RateLimit-Limit", String.valueOf(d.limit()));
            }
            return;
        }
        String body =
                "{\"error\":\"rate_limit_exceeded\",\"message\":\"Too many requests on public API. Try again later.\"}";
        ctx.abortWith(
                Response.status(429)
                        .entity(body)
                        .type(MediaType.APPLICATION_JSON)
                        .header("Retry-After", String.valueOf(d.retryAfterSeconds()))
                        .header("X-RateLimit-Limit", String.valueOf(d.limit()))
                        .build());
    }

    static String publicPathPrefix(String path) {
        int slash = path.indexOf('/', "/api/public/".length());
        if (slash < 0) {
            return path;
        }
        return path.substring(0, slash);
    }

    static String clientKey(ContainerRequestContext ctx) {
        String xff = ctx.getHeaderString("X-Forwarded-For");
        if (xff != null && !xff.isBlank()) {
            String first = xff.split(",")[0].trim();
            if (!first.isEmpty()) {
                return first;
            }
        }
        String realIp = ctx.getHeaderString("X-Real-IP");
        if (realIp != null && !realIp.isBlank()) {
            return realIp.trim();
        }
        return "unknown";
    }
}
