package com.aerosuite.security;

import com.aerosuite.domain.TenantConstants;
import com.aerosuite.service.AccessAuditService;
import io.jsonwebtoken.Claims;
import jakarta.annotation.Priority;
import jakarta.inject.Inject;
import jakarta.ws.rs.Priorities;
import jakarta.ws.rs.container.ContainerRequestContext;
import jakarta.ws.rs.container.ContainerRequestFilter;
import jakarta.ws.rs.container.PreMatching;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.Provider;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.Optional;

/**
 * Exige Bearer válido (JWT interno HS256 ou token externo legado {@code EXT:}) em todos os caminhos
 * da API exceto lista explícita e OPTIONS. Token interno Base64 legado só se
 * {@code aero.suite.auth.allow-legacy-internal-base64=true}.
 */
@Provider
@PreMatching
@Priority(Priorities.AUTHENTICATION)
public class JwtAuthenticationFilter implements ContainerRequestFilter {

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    AuthRequestAttributes authRequestAttributes;

    @Inject
    AccessAuditService accessAuditService;

    @ConfigProperty(name = "aero.suite.auth.require-jwt", defaultValue = "true")
    boolean requireJwt;

    @Override
    public void filter(ContainerRequestContext requestContext) {
        internalUserContext.clear();
        authRequestAttributes.clear();

        if (!requireJwt) {
            tryApplyOptionalAuth(requestContext);
            return;
        }

        if ("OPTIONS".equalsIgnoreCase(requestContext.getMethod())) {
            return;
        }

        String path = requestContext.getUriInfo().getRequestUri().getPath();
        if (path == null || path.isEmpty()) {
            path = "/";
        }
        if (!path.startsWith("/")) {
            path = "/" + path;
        }

        if (isPublicPath(path)) {
            return;
        }

        String raw = resolveBearerToken(requestContext, path);
        if (raw == null || raw.isEmpty()) {
            abortUnauthorized(requestContext, "MISSING_BEARER");
            return;
        }

        Optional<JwtTokenService.ExternoLegacyToken> externo = jwtTokenService.tryParseExternoLegacyToken(raw);
        if (externo.isPresent()) {
            JwtTokenService.ExternoLegacyToken ext = externo.get();
            long orgTenantId = ext.orgTenantId() != null
                    ? ext.orgTenantId()
                    : TenantConstants.DEFAULT_TENANT_ID;
            authRequestAttributes.setExternalLegacyUser(ext.userId(), ext.email(), orgTenantId);
            return;
        }

        Optional<Claims> internalJwt = jwtTokenService.parseAndVerifyInternal(raw);
        if (internalJwt.isPresent()) {
            if (!applyInternalJwt(internalJwt.get(), requestContext, false)) {
                return;
            }
            return;
        }

        Optional<Claims> platformOpsJwt = jwtTokenService.parseAndVerifyPlatformOps(raw);
        if (platformOpsJwt.isPresent()) {
            if (!applyPlatformOpsJwt(platformOpsJwt.get(), requestContext, false)) {
                return;
            }
            return;
        }

        if (isMfaAuthPath(path)) {
            Optional<Claims> mfaSetup = jwtTokenService.parseAndVerifyMfaSetup(raw);
            if (mfaSetup.isPresent()) {
                if (!applyInternalJwt(mfaSetup.get(), requestContext, false)) {
                    return;
                }
                return;
            }
        }

        Optional<JwtTokenService.LegacyInternalToken> legacy = jwtTokenService.tryParseLegacyInternalBase64(raw);
        if (legacy.isPresent()) {
            if (!applyLegacyInternal(legacy.get(), requestContext, false)) {
                return;
            }
            return;
        }

        abortUnauthorized(requestContext, "INVALID_TOKEN");
    }

    /**
     * Em testes ({@code aero.suite.auth.require-jwt=false}) ainda preenche o contexto se houver Bearer válido.
     */
    private void tryApplyOptionalAuth(ContainerRequestContext requestContext) {
        String authHeader = requestContext.getHeaderString("Authorization");
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            return;
        }
        String raw = authHeader.substring(7).trim();
        if (raw.isEmpty()) {
            return;
        }
        Optional<JwtTokenService.ExternoLegacyToken> externo = jwtTokenService.tryParseExternoLegacyToken(raw);
        if (externo.isPresent()) {
            JwtTokenService.ExternoLegacyToken ext = externo.get();
            long orgTenantId = ext.orgTenantId() != null
                    ? ext.orgTenantId()
                    : TenantConstants.DEFAULT_TENANT_ID;
            authRequestAttributes.setExternalLegacyUser(ext.userId(), ext.email(), orgTenantId);
            return;
        }
        jwtTokenService.parseAndVerifyInternal(raw).ifPresent(c -> applyInternalJwt(c, requestContext, true));
        if (!internalUserContext.isAuthenticated()) {
            jwtTokenService.tryParseLegacyInternalBase64(raw).ifPresent(t -> applyLegacyInternal(t, requestContext, true));
        }
    }

    /**
     * Confia no JWT já verificado (HS256). Validação de utilizador ativo/tenant ocorre no login
     * e nos recursos que acedem à BD em worker thread — evita Panache no event loop do Vert.x.
     *
     * @param optionalAuth se {@code true} (modo teste), falhas não abortam o pedido — apenas não autentica.
     */
    private boolean applyInternalJwt(Claims c, ContainerRequestContext requestContext, boolean optionalAuth) {
        try {
            int uid = Integer.parseInt(c.getSubject());
            String email = c.get("email", String.class);
            String name = c.get("name", String.class);
            Long tidClaim = JwtTokenService.extractTenantIdFromClaims(c);
            long effectiveTid = tidClaim != null ? tidClaim : TenantConstants.DEFAULT_TENANT_ID;
            internalUserContext.setInternalUser(
                    uid, email != null ? email : "", name != null ? name : "", effectiveTid);
            return true;
        } catch (NumberFormatException e) {
            if (!optionalAuth) {
                abortUnauthorized(requestContext, "INVALID_JWT_SUBJECT");
            }
            return false;
        }
    }

    private boolean applyPlatformOpsJwt(Claims c, ContainerRequestContext requestContext, boolean optionalAuth) {
        if (!applyInternalJwt(c, requestContext, optionalAuth)) {
            return false;
        }
        internalUserContext.setPlatformOpsElevated(true);
        long mfaAt = JwtTokenService.extractMfaAtFromClaims(c);
        internalUserContext.setPlatformOpsMfaAtEpochSec(mfaAt > 0 ? mfaAt : null);
        return true;
    }

    private boolean applyLegacyInternal(
            JwtTokenService.LegacyInternalToken t, ContainerRequestContext requestContext, boolean optionalAuth) {
        internalUserContext.setInternalUser(
                t.userId(), t.email() != null ? t.email() : "", null, TenantConstants.DEFAULT_TENANT_ID);
        return true;
    }

    private static boolean isMfaAuthPath(String p) {
        return p.startsWith("/api/auth/mfa/") || p.startsWith("/api/platform-ops/mfa/");
    }

    private static boolean isPublicPath(String p) {
        if (p.startsWith("/q/")) {
            return true;
        }
        if (p.startsWith("/api/sistema-atualizacao/status")
                || p.startsWith("/api/sistema-atualizacao/verificar")) {
            return true;
        }
        if (p.startsWith("/api/usuarios/foto/") || p.startsWith("/api/public/usuario-foto/")) {
            return true;
        }
        if (p.startsWith("/api/public/empresa-asset")) {
            return true;
        }
        if (p.startsWith("/api/public/sistema-empresa")) {
            return true;
        }
        if (p.startsWith("/api/public/health")) {
            return true;
        }
        if (p.startsWith("/api/public/deployment")) {
            return true;
        }
        if (p.startsWith("/api/public/lgpd")) {
            return true;
        }
        if (p.startsWith("/api/public/signup")) {
            return true;
        }
        if (p.startsWith("/api/public/onboarding/")) {
            return true;
        }
        if (p.startsWith("/api/public/estoque/")) {
            return true;
        }
        if (p.startsWith("/api/public/vitrine/")) {
            return true;
        }
        if (p.startsWith("/api/billing/webhooks")) {
            return true;
        }
        if (p.startsWith("/api/integracoes/bling/webhook")) {
            return true;
        }
        if (p.startsWith("/webhooks/evolution")) {
            return true;
        }
        if (p.startsWith("/api/integracoes/bling/oauth/callback")) {
            return true;
        }
        if (p.startsWith("/api/auth/login")) {
            return true;
        }
        if (p.startsWith("/api/platform-ops/login")) {
            return true;
        }
        if (p.startsWith("/api/auth/login-tenants")) {
            return true;
        }
        if (p.startsWith("/api/auth/forgot-password")) {
            return true;
        }
        if (p.startsWith("/api/auth/validate-reset-token/")) {
            return true;
        }
        if (p.startsWith("/api/auth/reset-password")) {
            return true;
        }
        if (p.startsWith("/api/auth/change-password-new-user")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/login")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/login-tenants")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/forgot-password")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/reset-password")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/change-password-new-user")) {
            return true;
        }
        // PNG de código de barras em <img src> (sem header Authorization)
        if (p.startsWith("/api/products/barcode/")) {
            return true;
        }
        if (p.matches("/api/products/\\d+/barcode")) {
            return true;
        }
        return false;
    }

    /**
     * Bearer no header, ou {@code access_token} na query para mídia da vitrine
     * ({@code <video>}/{@code <img>} não enviam Authorization).
     */
    private static String resolveBearerToken(ContainerRequestContext requestContext, String path) {
        String authHeader = requestContext.getHeaderString("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            String raw = authHeader.substring(7).trim();
            if (!raw.isEmpty()) {
                return raw;
            }
        }
        if (isVitrineMediaPath(path)) {
            var params = requestContext.getUriInfo().getQueryParameters().get("access_token");
            if (params != null && !params.isEmpty()) {
                String q = params.get(0);
                if (q != null && !q.isBlank()) {
                    return q.trim();
                }
            }
        }
        return null;
    }

    private static boolean isVitrineMediaPath(String path) {
        String p = path == null ? "" : path;
        return p.startsWith("/api/vitrine/media/");
    }

    private void abortUnauthorized(ContainerRequestContext requestContext, String detalhe) {
        String path = requestContext.getUriInfo() != null ? requestContext.getUriInfo().getPath() : null;
        accessAuditService.authUnauthorized(
                detalhe,
                clientIp(requestContext),
                requestContext.getHeaderString("User-Agent"),
                path);
        requestContext.abortWith(Response.status(Response.Status.UNAUTHORIZED)
                .entity("{\"message\":\"Não autenticado\"}")
                .type("application/json")
                .build());
    }

    private static String clientIp(ContainerRequestContext ctx) {
        String ip = ctx.getHeaderString("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = ctx.getHeaderString("X-Real-IP");
        }
        return ip;
    }
}
