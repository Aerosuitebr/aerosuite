package com.aerosuite.service;

import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.LoginResponse;
import com.aerosuite.dto.MfaConfirmRequest;
import com.aerosuite.dto.MfaSetupResponse;
import com.aerosuite.dto.MfaStatusResponse;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.JwtTokenService;
import com.aerosuite.security.MfaPolicyService;
import com.aerosuite.security.MfaSecretCipher;
import com.aerosuite.security.TotpService;
import io.jsonwebtoken.Claims;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;

import java.util.Optional;

@ApplicationScoped
public class MfaAuthService {

    @Inject
    MfaPolicyService mfaPolicyService;

    @Inject
    MfaSecretCipher mfaSecretCipher;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    AuthService authService;

    public MfaStatusResponse statusForUser(Usuario usuario) {
        boolean required = mfaPolicyService.isMfaRequired(usuario);
        boolean enabled = Boolean.TRUE.equals(usuario.mfaEnabled);
        return new MfaStatusResponse(required, enabled, required && !enabled);
    }

    @Transactional
    public MfaSetupResponse beginSetup(Usuario usuario, String issuer) {
        Usuario u = requireManagedUsuario(usuario);
        String plainSecret = TotpService.generateSecretBase32();
        u.mfaTotpSecret = mfaSecretCipher.encrypt(plainSecret);
        u.mfaEnabled = false;

        String account = u.email != null ? u.email : String.valueOf(u.id);
        String otpAuthUri = TotpService.buildOtpAuthUri(issuer, account, plainSecret);
        return new MfaSetupResponse(plainSecret, otpAuthUri, false);
    }

    @Transactional
    public LoginResponse confirmSetup(Usuario usuario, MfaConfirmRequest request) {
        confirmSetupOnly(usuario, request);
        return authService.createLoginResponse(usuario);
    }

    @Transactional
    public void confirmSetupOnly(Usuario usuario, MfaConfirmRequest request) {
        Usuario u = requireManagedUsuario(usuario);
        if (request == null || request.totpCode == null || request.totpCode.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_MFA_CODE_REQUIRED));
        }
        String secret = resolvePlainSecret(u);
        if (secret == null || !TotpService.verify(secret, request.totpCode)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_MFA_CODE_INVALID));
        }
        u.mfaEnabled = true;
    }

    @Transactional
    public void disableForUser(Usuario usuario, MfaConfirmRequest request) {
        Usuario u = requireManagedUsuario(usuario);
        if (!Boolean.TRUE.equals(u.mfaEnabled)) {
            return;
        }
        if (request == null || request.totpCode == null || request.totpCode.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_MFA_CODE_REQUIRED));
        }
        String secret = resolvePlainSecret(u);
        if (secret == null || !TotpService.verify(secret, request.totpCode)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_MFA_CODE_INVALID));
        }
        u.mfaEnabled = false;
        u.mfaTotpSecret = null;
    }

    public Usuario resolveUserFromMfaSetupToken(String bearerToken) {
        Optional<Claims> claims = jwtTokenService.parseAndVerifyMfaSetup(bearerToken);
        if (claims.isEmpty()) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TOKEN_INVALID));
        }
        int uid = Integer.parseInt(claims.get().getSubject());
        Usuario usuario = Usuario.findById(uid);
        if (usuario == null || usuario.ativo == null || !usuario.ativo) {
            throw new ForbiddenException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND_OR_INACTIVE));
        }
        return usuario;
    }

    private Usuario requireManagedUsuario(Usuario usuario) {
        if (usuario == null || usuario.id == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND));
        }
        Usuario managed = Usuario.findById(usuario.id);
        if (managed == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND));
        }
        return managed;
    }

    String resolvePlainSecret(Usuario usuario) {
        if (usuario == null || usuario.mfaTotpSecret == null || usuario.mfaTotpSecret.isBlank()) {
            return null;
        }
        return mfaSecretCipher.decrypt(usuario.mfaTotpSecret);
    }

    public void assertTotpCode(Usuario usuario, String totpCode) {
        if (!Boolean.TRUE.equals(usuario.mfaEnabled)) {
            throw AuthMfaException.enrollmentRequired(
                    jwtTokenService.mintMfaSetupToken(usuario));
        }
        if (totpCode == null || totpCode.isBlank()) {
            throw AuthLoginException.of("MFA_REQUIRED");
        }
        String secret = resolvePlainSecret(usuario);
        if (secret == null || !TotpService.verify(secret, totpCode)) {
            throw AuthLoginException.of("INVALID_MFA_CODE");
        }
    }
}
