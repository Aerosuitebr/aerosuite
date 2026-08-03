package com.aerosuite.service;

import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.MfaConfirmRequest;
import com.aerosuite.dto.MfaSetupResponse;
import com.aerosuite.dto.PlatformOpsLoginRequest;
import com.aerosuite.dto.PlatformOpsSessionResponse;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.JwtTokenService;
import com.aerosuite.security.PasswordCredentials;
import io.jsonwebtoken.Claims;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotAuthorizedException;
import java.time.Instant;
import java.util.Arrays;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Autenticação do plano de controle (infraestrutura SaaS).
 * Lista de e-mails permitida via configuração — não depende do RBAC tenant.
 */
@ApplicationScoped
public class PlatformOpsAuthService {

    @Inject
    TenantLoginService tenantLoginService;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    MfaAuthService mfaAuthService;

    @ConfigProperty(name = "aero.suite.platform.ops.allowed-emails", defaultValue = "admin@aerosuite.com")
    String allowedEmailsRaw;

    @ConfigProperty(name = "aero.suite.platform.ops.mfa-required", defaultValue = "true")
    boolean platformOpsMfaRequired;

    @ConfigProperty(name = "aero.suite.platform.ops.mfa-revalidate-minutes", defaultValue = "30")
    int mfaRevalidateMinutes;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    PlatformOperatorAccessService platformOperatorAccessService;

    @Inject
    EnvironmentLabelService environmentLabelService;

    public PlatformOpsSessionResponse login(PlatformOpsLoginRequest request) {
        if (request == null || request.email == null || request.email.isBlank()
                || request.password == null || request.password.isBlank()) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        String email = request.email.trim().toLowerCase(Locale.ROOT);
        if (!isEmailAllowed(email)) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }

        TenantLoginService.ResolvedLogin<Usuario> resolved;
        try {
            resolved = tenantLoginService.resolveInternalLogin(
                    email, request.password, TenantConstants.DEFAULT_CODIGO);
        } catch (RuntimeException ex) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        Usuario usuario = resolved.user();
        if (usuario == null || !Boolean.TRUE.equals(usuario.ativo)) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        long tid = usuario.orgTenantId != null ? usuario.orgTenantId : TenantConstants.DEFAULT_TENANT_ID;
        if (tid != TenantConstants.DEFAULT_TENANT_ID) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        if (!PasswordCredentials.matches(request.password, usuario.senha)) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        assertPlatformOpsMfa(usuario, request.totpCode);

        return mintSession(usuario);
    }

    public PlatformOpsSessionResponse elevateWithCredentials(int userId, String password, String totpCode) {
        if (password == null || password.isBlank()) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        Usuario usuario = Usuario.findById(userId);
        if (usuario == null || !Boolean.TRUE.equals(usuario.ativo)) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        String email = usuario.email != null ? usuario.email.trim().toLowerCase(Locale.ROOT) : "";
        if (!isEmailAllowed(email)) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        long tid = usuario.orgTenantId != null ? usuario.orgTenantId : TenantConstants.DEFAULT_TENANT_ID;
        if (tid != TenantConstants.DEFAULT_TENANT_ID) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        if (!PasswordCredentials.matches(password, usuario.senha)) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        assertPlatformOpsMfa(usuario, totpCode);
        return mintSession(usuario);
    }

    /** @deprecated use {@link #elevateWithCredentials(int, String, String)} */
    @Deprecated(forRemoval = false)
    public PlatformOpsSessionResponse elevateWithPassword(int userId, String password) {
        return elevateWithCredentials(userId, password, null);
    }

    /**
     * Renova a confirmação MFA sem exigir senha (sessão {@code pop} ainda válida).
     */
    public PlatformOpsSessionResponse revalidateMfa(int userId, String totpCode) {
        if (!internalUserContext.isAuthenticated() || !internalUserContext.isPlatformOpsElevated()) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_FORBIDDEN));
        }
        if (userId != internalUserContext.getUserId()) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        Usuario usuario = Usuario.findById(userId);
        if (usuario == null || !Boolean.TRUE.equals(usuario.ativo)) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        String email = usuario.email != null ? usuario.email.trim().toLowerCase(Locale.ROOT) : "";
        if (!isEmailAllowed(email)) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        if (!Boolean.TRUE.equals(usuario.mfaEnabled)) {
            throw AuthMfaException.enrollmentRequired(jwtTokenService.mintMfaSetupToken(usuario));
        }
        if (totpCode == null || totpCode.isBlank()) {
            throw AuthLoginException.of("MFA_REQUIRED");
        }
        String secret = mfaAuthService.resolvePlainSecret(usuario);
        if (secret == null || !com.aerosuite.security.TotpService.verify(secret, totpCode)) {
            throw AuthLoginException.of("INVALID_MFA_CODE");
        }
        return mintSession(usuario);
    }

    /**
     * Conclui cadastro TOTP (token {@code mfa_setup}) e abre sessão elevada do plano de controle.
     */
    @Transactional
    public PlatformOpsSessionResponse confirmMfaEnrollment(String setupToken, String totpCode) {
        if (setupToken == null || setupToken.isBlank()) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TOKEN_INVALID));
        }
        Usuario usuario = mfaAuthService.resolveUserFromMfaSetupToken(setupToken.trim());
        if (usuario == null || !Boolean.TRUE.equals(usuario.ativo)) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        String email = usuario.email != null ? usuario.email.trim().toLowerCase(Locale.ROOT) : "";
        if (!isEmailAllowed(email)) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        long tid = usuario.orgTenantId != null ? usuario.orgTenantId : TenantConstants.DEFAULT_TENANT_ID;
        if (tid != TenantConstants.DEFAULT_TENANT_ID) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        MfaConfirmRequest req = new MfaConfirmRequest();
        req.totpCode = totpCode;
        try {
            mfaAuthService.confirmSetupOnly(usuario, req);
        } catch (jakarta.ws.rs.BadRequestException ex) {
            String msg = ex.getMessage();
            if (msg != null && msg.contains(ApiI18nMessages.AUTH_MFA_CODE_REQUIRED)) {
                throw AuthLoginException.of("MFA_REQUIRED");
            }
            throw AuthLoginException.of("INVALID_MFA_CODE");
        }
        return mintSession(usuario);
    }

    private void assertPlatformOpsMfa(Usuario usuario, String totpCode) {
        if (!platformOpsMfaRequired) {
            return;
        }
        mfaAuthService.assertTotpCode(usuario, totpCode);
    }

    /**
     * Inicia cadastro MFA para operador (Bearer = token {@code mfa_setup}).
     */
    public MfaSetupResponse beginMfaEnrollment(String setupToken) {
        if (setupToken == null || setupToken.isBlank()) {
            throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TOKEN_INVALID));
        }
        Usuario usuario = mfaAuthService.resolveUserFromMfaSetupToken(setupToken.trim());
        String email = usuario.email != null ? usuario.email.trim().toLowerCase(Locale.ROOT) : "";
        if (!isEmailAllowed(email)) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.PLATFORM_OPS_LOGIN_DENIED));
        }
        return mfaAuthService.beginSetup(usuario, environmentLabelService.platformOpsMfaIssuer());
    }

    private PlatformOpsSessionResponse mintSession(Usuario usuario) {
        long mfaAt = Instant.now().getEpochSecond();
        String token = jwtTokenService.mintPlatformOpsToken(usuario, mfaAt);
        Optional<Claims> claims = jwtTokenService.parseAndVerifyPlatformOps(token);
        long expMs = claims.map(c -> c.getExpiration().getTime()).orElse(Instant.now().toEpochMilli());
        PlatformOpsSessionResponse res = new PlatformOpsSessionResponse();
        res.token = token;
        res.expiresAtEpochMs = expMs;
        res.email = usuario.email;
        res.nome = usuario.nome;
        res.mfaValidatedAtEpochMs = mfaAt * 1000L;
        res.mfaRevalidateMinutes = Math.max(5, mfaRevalidateMinutes);
        return res;
    }

    private boolean isEmailAllowed(String email) {
        if (email == null || email.isBlank()) {
            return false;
        }
        String normalized = email.trim().toLowerCase(Locale.ROOT);
        if (parseAllowedEmails().contains(normalized)) {
            return true;
        }
        return platformOperatorAccessService.hasActiveDatabaseGrant(normalized);
    }

    /** Verifica elegibilidade sem autenticar (uso interno + API). */
    public boolean isEmailEligible(String email) {
        return isEmailAllowed(email);
    }

    public boolean isCurrentUserEligible(String email, Long tenantId) {
        if (email == null || email.isBlank()) {
            return false;
        }
        long tid = tenantId != null ? tenantId : TenantConstants.DEFAULT_TENANT_ID;
        if (tid != TenantConstants.DEFAULT_TENANT_ID) {
            return false;
        }
        return isEmailAllowed(email);
    }

    private Set<String> parseAllowedEmails() {
        return Arrays.stream(allowedEmailsRaw.split(","))
                .map(String::trim)
                .map(s -> s.toLowerCase(Locale.ROOT))
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}
