package com.aerosuite.service;

import com.aerosuite.domain.PasswordHistory;
import com.aerosuite.domain.PasswordResetToken;
import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.LoginRequest;
import com.aerosuite.dto.LoginResponse;
import com.aerosuite.dto.MessageResponse;
import com.aerosuite.dto.TokenValidationResponse;
import com.aerosuite.dto.UserDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.AuthI18nCodes;
import com.aerosuite.mapping.UserMapper;
import com.aerosuite.security.JwtTokenService;
import com.aerosuite.security.MfaPolicyService;
import com.aerosuite.security.PasswordCredentials;
import com.aerosuite.security.PasswordPolicyValidator;
import com.aerosuite.security.PermissionProfileService;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.util.ServerUrlUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;
import java.security.SecureRandom;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Base64;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@ApplicationScoped
public class AuthService {

    private static final Logger LOG = Logger.getLogger(AuthService.class);

    @Inject
    UserMapper userMapper;
    
    @Inject
    EmailService emailService;
    
    @Inject
    ServerUrlUtil serverUrlUtil;

    @Inject
    JwtTokenService jwtTokenService;

    @Inject
    PermissionProfileService permissionProfileService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    TenantLoginService tenantLoginService;

    @Inject
    P1UserEnrichmentService p1UserEnrichmentService;

    @Inject
    TenantBillingService tenantBillingService;

    @Inject
    AccessAuditService accessAuditService;

    @Inject
    MfaPolicyService mfaPolicyService;

    @Inject
    MfaAuthService mfaAuthService;

    @Inject
    FuncionalidadeService funcionalidadeService;

    @Inject
    TenantModuleService tenantModuleService;

    private static final SecureRandom secureRandom = new SecureRandom();

    @Transactional
    public LoginResponse login(LoginRequest request, String ip, String userAgent) {
        TenantLoginService.ResolvedLogin<Usuario> resolved = tenantLoginService.resolveInternalLogin(
                request.email, request.password, request.tenantCodigo);
        Usuario usuario = resolved.user();
        if (usuario == null) {
            throw new AuthLoginException("INVALID_CREDENTIALS", AuthI18nCodes.encodedMessage("INVALID_CREDENTIALS"));
        }

        if (!PasswordCredentials.matches(request.password, usuario.senha)) {
            throw new AuthLoginException("INVALID_CREDENTIALS", AuthI18nCodes.encodedMessage("INVALID_CREDENTIALS"));
        }
        if (!PasswordCredentials.looksBcrypt(usuario.senha)) {
            usuario.senha = PasswordCredentials.hash(request.password);
        }
        if (usuario.ativo == null || !usuario.ativo) {
            throw new AuthLoginException("USER_INACTIVE", AuthI18nCodes.encodedMessage("USER_INACTIVE"));
        }
        if (tenantBillingService.blocksAccess(usuario.orgTenantId)) {
            throw new AuthLoginException(
                    "SUBSCRIPTION_INACTIVE", AuthI18nCodes.encodedMessage("SUBSCRIPTION_INACTIVE"));
        }

        if (mfaPolicyService.isMfaRequired(usuario)) {
            mfaAuthService.assertTotpCode(usuario, request.totpCode);
        }

        usuario.ultimoAcesso = java.time.LocalDateTime.now();
        usuario.persist();

        accessAuditService.loginSuccess(usuario.orgTenantId, usuario.id, usuario.email, ip, userAgent);
        Usuario forResponse = hydrateUsuarioForSessionPayload(usuario);
        return createLoginResponse(forResponse);
    }

    /** Perfil + tenant no DTO sem carregar a coleção de funcionalidades via JOIN FETCH. */
    private Usuario hydrateUsuarioForSessionPayload(Usuario usuario) {
        if (usuario == null || usuario.email == null || usuario.orgTenantId == null) {
            return usuario;
        }
        String normalized = usuario.email.trim().toLowerCase(Locale.ROOT);
        Usuario hydrated =
                tenantLoginService.loadInternalUserWithPerfil(normalized, usuario.orgTenantId);
        return hydrated != null ? hydrated : usuario;
    }

    public List<com.aerosuite.dto.TenantLoginOptionDto> listLoginTenantsForEmail(String email) {
        return tenantLoginService.listTenantsForInternalEmail(email);
    }

    public void recordLoginFailure(LoginRequest request, String code, String ip, String userAgent) {
        String email = request != null ? request.email : null;
        String tenant = request != null ? request.tenantCodigo : null;
        accessAuditService.loginFailure(email, tenant, code, ip, userAgent);
    }

    /** Token JWT + {@link UserDto} com {@code funcionalidadeCodigos} (perfil + delegações). */
    public LoginResponse createLoginResponse(Usuario usuario) {
        String token = jwtTokenService.mintInternalToken(usuario);
        UserDto userDto = buildUserDtoWithPermissions(usuario);
        return new LoginResponse(token, userDto);
    }

    public UserDto buildUserDtoWithPermissions(Usuario usuario) {
        UserDto userDto = userMapper.toDto(usuario);
        Tenant tenant = null;
        if (usuario != null && usuario.orgTenantId != null) {
            tenant = Tenant.findById(usuario.orgTenantId);
            tenantLoginService.enrichUserDtoWithTenant(userDto, tenant);
        }
        if (usuario != null && usuario.id != null) {
            PermissionProfileService.PermissionSnapshot snap = permissionProfileService.loadSnapshot(usuario);
            userDto.funcionalidadeCodigos = new ArrayList<>(snap.funcionalidadeCodigos());
            Set<String> enabledModules = tenantModuleService.enabledModules(tenant);
            userDto.menuFuncionalidades = funcionalidadeService.listarMenuDtoEfetivoParaUsuario(
                    usuario, enabledModules);
        }
        p1UserEnrichmentService.enrich(userDto, usuario, tenant);
        return userDto;
    }

    /**
     * Utilizador autenticado: mesmo payload que no login (sem emitir novo token).
     */
    public UserDto getUserDtoForSession(Integer userId) {
        if (userId == null) {
            return null;
        }
        Usuario usuario = loadUsuarioWithPerfil(userId);
        if (usuario == null || usuario.ativo == null || !usuario.ativo) {
            return null;
        }
        Long ctxTenant = internalUserContext.getTenantId();
        if (ctxTenant != null && usuario.orgTenantId != null && !ctxTenant.equals(usuario.orgTenantId)) {
            return null;
        }
        return buildUserDtoWithPermissions(usuario);
    }

    private Usuario loadUsuarioWithPerfil(Integer userId) {
        if (userId == null) {
            return null;
        }
        return Usuario.find(
                        "SELECT DISTINCT u FROM Usuario u LEFT JOIN FETCH u.perfil p WHERE u.id = ?1",
                        userId)
                .firstResult();
    }
    
    /**
     * Solicita reset de senha
     */
    @Transactional
    public MessageResponse requestPasswordReset(String email, String tenantCodigo) {
        Usuario usuario;
        try {
            usuario = tenantLoginService.resolveInternalUserByEmail(email, tenantCodigo).user();
        } catch (AuthLoginException e) {
            if ("TENANT_REQUIRED".equals(e.code)) {
                throw e;
            }
            usuario = null;
        }

        // Por segurança, sempre retornar sucesso mesmo se o email não existir
        if (usuario == null || usuario.ativo == null || !usuario.ativo) {
            LOG.debugf("Password reset solicitado para e-mail não encontrado ou inativo (tenant=%s)", tenantCodigo);
            return new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_FORGOT_PASSWORD_ACK));
        }

        PasswordResetToken.invalidateTokensByEmail(normalizeEmail(email));
        String token = generateSecureToken();

        PasswordResetToken resetToken = new PasswordResetToken();
        resetToken.token = token;
        resetToken.email = normalizeEmail(email);
        resetToken.orgTenantId = usuario.orgTenantId;
        resetToken.expiresAt = LocalDateTime.now().plusHours(1);
        resetToken.used = false;
        resetToken.persist();

        String frontendUrl = serverUrlUtil.getFrontendUrl();
        String resetUrl = frontendUrl + "/reset-password?token=" + token;
        if (resetUrl.contains("localhost") || resetUrl.contains("127.0.0.1")) {
            LOG.warnf("Reset URL contém localhost — verifique AERO_FRONTEND_URL (url=%s)", resetUrl);
        }

        try {
            emailService.sendPasswordResetEmail(
                    email, resetUrl, com.aerosuite.i18n.UserLocaleResolver.resolve(usuario), false);
            LOG.infof("E-mail de reset de senha enviado para %s", email);
        } catch (Exception e) {
            LOG.warnf(e, "Falha ao enviar e-mail de reset para %s (token persistido)", email);
        }

        return new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_FORGOT_PASSWORD_ACK));
    }
    
    /**
     * Valida token de reset de senha
     */
    public TokenValidationResponse validateResetToken(String token) {
        PasswordResetToken resetToken = PasswordResetToken.findByToken(token);
        
        if (resetToken == null || !resetToken.isValid()) {
            return new TokenValidationResponse(false, null);
        }
        
        return new TokenValidationResponse(true, resetToken.email);
    }
    
    /**
     * Redefine a senha usando o token
     */
    @Transactional
    public MessageResponse resetPassword(String token, String newPassword) {
        // Validar token
        PasswordResetToken resetToken = PasswordResetToken.findByToken(token);
        
        if (resetToken == null || !resetToken.isValid()) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TOKEN_INVALID));
        }
        
        PasswordPolicyValidator.requireValidRuntime(newPassword);
        
        // Buscar usuário da organização correta (mesmo e-mail pode existir em vários tenants)
        Usuario usuario = findUsuarioForPasswordReset(resetToken);

        if (usuario == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND));
        }
        
        // Verificar se a nova senha não está nas últimas 5 senhas
        if (isPasswordInHistory(usuario.id, newPassword, 5)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_REUSED));
        }
        
        // Salvar senha antiga no histórico antes de atualizar
        savePasswordToHistory(usuario.id, usuario.senha);
        
        // Atualizar senha
        usuario.senha = PasswordCredentials.hash(newPassword);
        // Se estava marcado para trocar senha, remover a marcação
        if (usuario.precisaTrocarSenha != null && usuario.precisaTrocarSenha) {
            usuario.precisaTrocarSenha = false;
        }
        usuario.persist();
        
        // Marcar token como usado
        resetToken.used = true;
        resetToken.persist();
        
        return new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_RESET_SUCCESS));
    }
    
    /**
     * Gera token seguro aleatório
     */
    private static String normalizeEmail(String email) {
        return email == null ? "" : email.trim().toLowerCase(Locale.ROOT);
    }

    /**
     * Resolve a conta interna associada ao token de reset.
     * Tokens novos carregam {@code orgTenantId}; tokens legados só funcionam se o e-mail for único.
     */
    private Usuario findUsuarioForPasswordReset(PasswordResetToken resetToken) {
        if (resetToken == null || resetToken.email == null || resetToken.email.isBlank()) {
            return null;
        }
        String email = normalizeEmail(resetToken.email);
        if (resetToken.orgTenantId != null) {
            return Usuario.find(
                            "email = ?1 and orgTenantId = ?2 and ativo = true",
                            email,
                            resetToken.orgTenantId)
                    .firstResult();
        }
        @SuppressWarnings("unchecked")
        List<Usuario> active = (List<Usuario>) (List<?>) Usuario.list(
                "email = ?1 and ativo = true", email);
        if (active.isEmpty()) {
            return null;
        }
        if (active.size() == 1) {
            return active.get(0);
        }
        LOG.warnf(
                "Reset de senha ambíguo para %s (%d contas ativas). Solicite novo link escolhendo a organização.",
                email,
                active.size());
        return null;
    }

    private String generateSecureToken() {
        byte[] randomBytes = new byte[32];
        secureRandom.nextBytes(randomBytes);
        return Base64.getUrlEncoder().withoutPadding().encodeToString(randomBytes);
    }
    
    /**
     * Cria token para configuração inicial de senha (novo usuário)
     */
    @Transactional
    public String createPasswordSetupToken(String email, Long orgTenantId) {
        String normalized = normalizeEmail(email);
        PasswordResetToken.invalidateTokensByEmail(normalized);

        String token = generateSecureToken();

        PasswordResetToken setupToken = new PasswordResetToken();
        setupToken.token = token;
        setupToken.email = normalized;
        setupToken.orgTenantId = orgTenantId;
        setupToken.expiresAt = LocalDateTime.now().plusDays(7);
        setupToken.used = false;
        setupToken.persist();

        return token;
    }

    /** @deprecated preferir {@link #createPasswordSetupToken(String, Long)} */
    @Deprecated
    @Transactional
    public String createPasswordSetupToken(String email) {
        String normalized = normalizeEmail(email);
        @SuppressWarnings("unchecked")
        List<Usuario> active = (List<Usuario>) (List<?>) Usuario.list(
                "email = ?1 and ativo = true", normalized);
        Long orgTenantId = active.size() == 1 ? active.get(0).orgTenantId : null;
        return createPasswordSetupToken(email, orgTenantId);
    }
    
    /**
     * Valida senha atual antes de permitir redefinição
     */
    @Transactional
    public MessageResponse validateCurrentPassword(String email, String currentPassword) {
        Usuario usuario = Usuario.find("email = ?1", email).firstResult();
        
        if (usuario == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND));
        }
        
        if (!PasswordCredentials.matches(currentPassword, usuario.senha)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_CURRENT_PASSWORD_WRONG));
        }
        
        return new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_CURRENT_PASSWORD_VALID));
    }
    
    /**
     * Troca senha para usuário novo (primeira vez)
     * Usa a senha temporária para autenticar e define nova senha
     */
    @Transactional
    public LoginResponse changePasswordForNewUser(String email, String senhaTemporaria, String novaSenha) {
        Usuario usuario = Usuario.find("email = ?1", email).firstResult();
        
        if (usuario == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND));
        }
        
        // Verificar se usuário precisa trocar senha
        if (usuario.precisaTrocarSenha == null || !usuario.precisaTrocarSenha) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_NO_PASSWORD_CHANGE_REQUIRED));
        }
        
        // Verificar senha temporária
        if (!PasswordCredentials.matches(senhaTemporaria, usuario.senha)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TEMP_PASSWORD_WRONG));
        }
        
        // Validar nova senha
        PasswordPolicyValidator.requireValidRuntime(novaSenha);
        
        // Verificar se a nova senha não está nas últimas 5 senhas
        if (isPasswordInHistory(usuario.id, novaSenha, 5)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_REUSED));
        }
        
        // Salvar senha antiga no histórico antes de atualizar
        savePasswordToHistory(usuario.id, usuario.senha);
        
        // Atualizar senha
        usuario.senha = PasswordCredentials.hash(novaSenha);
        usuario.precisaTrocarSenha = false; // Marcar que já trocou a senha
        usuario.persist();
        
        LoginResponse response = createLoginResponse(usuario);
        response.message = ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_CHANGED);
        return response;
    }
    
    /**
     * Verifica se uma senha está no histórico das últimas N senhas do usuário
     */
    private boolean isPasswordInHistory(Integer usuarioId, String password, int lastNPasswords) {
        java.util.List<PasswordHistory> lastPasswords = PasswordHistory.findLastPasswordsByUsuario(usuarioId, lastNPasswords);
        
        for (PasswordHistory history : lastPasswords) {
            if (PasswordCredentials.looksBcrypt(history.senhaHash)) {
                if (PasswordCredentials.matches(password, history.senhaHash)) {
                    return true;
                }
            } else if (history.senhaHash != null && history.senhaHash.equals(password)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Salva a senha atual no histórico antes de atualizar
     */
    private void savePasswordToHistory(Integer usuarioId, String password) {
        PasswordHistory history = new PasswordHistory();
        history.usuarioId = usuarioId;
        history.senhaHash = PasswordCredentials.looksBcrypt(password) ? password : PasswordCredentials.hash(password);
        history.createdAt = LocalDateTime.now();
        history.persist();
        
        // Manter apenas as últimas 5 senhas no histórico
        PasswordHistory.deleteOldPasswords(usuarioId, 5);
    }
}
