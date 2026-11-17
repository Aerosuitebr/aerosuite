package com.aerosuite.security;

import com.aerosuite.service.TenantSupportService;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.ext.Provider;

import java.util.List;
import java.util.Set;

@Provider
@Priority(Priorities.AUTHORIZATION - 1)
public class TenantSupportAuthorizationFilter implements ContainerRequestFilter {
    private static final List<String> CONTROL_PATHS = List.of(
            "/api/platform", "/api/platform-ops", "/api/tenants", "/api/backup-config",
            "/api/admin-setup", "/api/sistema-atualizacao", "/api/auth-externo",
            "/api/usuario-preferences", "/api/lgpd", "/api/chat", "/api/notificacoes", "/api/vitrine");
    private static final Set<String> READ_METHODS = Set.of("GET", "HEAD", "OPTIONS");

    @Inject InternalUserContext context;
    @Inject TenantSupportService support;

    @Override
    public void filter(ContainerRequestContext request) {
        if (!context.isTenantSupport()) {
            return;
        }
        String path = request.getUriInfo().getRequestUri().getPath().replaceAll(";[^/]*", "").replaceAll("/{2,}", "/");
        String method = request.getMethod();
        if (!isAllowed(path, method) || (!READ_METHODS.contains(method)
                && under(path, "/api/usuarios/" + context.getUserId()))) {
            throw new ForbiddenException("Esta operação está fora da sessão de suporte da organização.");
        }
        support.validateRequest();
        if (!READ_METHODS.contains(method)) {
            support.auditChange(method, path, request.getHeaderString("X-Forwarded-For"),
                    request.getHeaderString("User-Agent"));
        }
    }

    static boolean isAllowed(String path, String method) {
        if (!path.startsWith("/api/") || path.contains("/../") || path.contains("/./")
                || path.endsWith("/..") || path.endsWith("/.")) {
            return false;
        }
        if (CONTROL_PATHS.stream().anyMatch(prefix -> under(path, prefix))) {
            return false;
        }
        if (under(path, "/api/auth")) {
            return "/api/auth/me".equals(path) && "GET".equals(method);
        }
        return READ_METHODS.contains(method) || !under(path, "/api/funcionalidades");
    }

    private static boolean under(String path, String prefix) {
        return path.equals(prefix) || path.startsWith(prefix + "/") || path.startsWith(prefix + ";");
    }
}
