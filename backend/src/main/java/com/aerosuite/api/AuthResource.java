package com.aerosuite.api;

import com.aerosuite.dto.ChangePasswordForNewUserRequest;
import com.aerosuite.dto.ForgotPasswordRequest;
import com.aerosuite.dto.LoginRequest;
import com.aerosuite.dto.LoginResponse;
import com.aerosuite.dto.MessageResponse;
import com.aerosuite.dto.ResetPasswordRequest;
import com.aerosuite.dto.TokenValidationResponse;
import com.aerosuite.dto.UserDto;
import com.aerosuite.dto.ValidateCurrentPasswordRequest;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.dto.TenantLoginOptionDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.AuthI18nCodes;
import com.aerosuite.service.AccessAuditService;
import com.aerosuite.service.AuthLoginException;
import com.aerosuite.service.AuthMfaException;
import com.aerosuite.service.AuthService;
import com.aerosuite.service.EnvironmentLabelService;
import com.aerosuite.service.MfaAuthService;
import com.aerosuite.dto.MfaConfirmRequest;
import com.aerosuite.dto.MfaSetupResponse;
import com.aerosuite.dto.MfaStatusResponse;
import com.aerosuite.domain.Usuario;
import com.aerosuite.service.UsuarioFotoStorage;
import com.aerosuite.service.UsuarioFotoUploadService;
import jakarta.transaction.Transactional;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.container.ContainerRequestContext;
import java.time.LocalDate;
import java.util.List;
import java.util.Map;
import io.quarkus.runtime.LaunchMode;
import org.jboss.logging.Logger;
import org.jboss.resteasy.reactive.RestForm;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@Path("/api/auth")
@Produces(MediaType.APPLICATION_JSON)
@Consumes({MediaType.APPLICATION_JSON, MediaType.MULTIPART_FORM_DATA})
public class AuthResource {

    private static final Logger LOG = Logger.getLogger(AuthResource.class);

    @Inject
    AuthService authService;

    @Inject
    AccessAuditService accessAuditService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    UsuarioFotoUploadService usuarioFotoUploadService;

    @Inject
    UsuarioFotoStorage usuarioFotoStorage;

    @Inject
    MfaAuthService mfaAuthService;

    @Inject
    EnvironmentLabelService environmentLabelService;

    @GET
    @Path("/me")
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public UserDto getCurrentUser() {
        UserDto dto = authService.getUserDtoForSession(internalUserContext.getUserId());
        if (dto == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND_OR_INACTIVE));
        }
        return dto;
    }

    /** Foto de perfil do utilizador autenticado (sem exigir funcionalidade USUARIOS). */
    @POST
    @Path("/me/foto")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @Produces(MediaType.APPLICATION_JSON)
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public Response uploadMyProfilePhoto(@RestForm("imagem") FileUpload file) {
        if (!internalUserContext.isAuthenticated() || internalUserContext.getUserId() == null) {
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(Map.of(
                            "error", ApiI18nMessages.encode(ApiI18nMessages.COMMON_NOT_AUTHENTICATED),
                            "message", ApiI18nMessages.encode(ApiI18nMessages.AUTH_LOGIN_AGAIN)))
                    .build();
        }
        return usuarioFotoUploadService.upload(internalUserContext.getUserId(), file);
    }

    /** Imagem da foto do utilizador autenticado (Bearer); disco ou {@code foto_perfil_dados}. */
    @GET
    @Path("/me/foto")
    @Produces({"image/jpeg", "image/png", "image/gif", "image/webp"})
    @RequiresFuncionalidades(onlyAuthenticated = true)
    @Transactional
    public Response getMyProfilePhoto() {
        if (!internalUserContext.isAuthenticated() || internalUserContext.getUserId() == null) {
            return Response.status(Response.Status.UNAUTHORIZED).build();
        }
        try {
            int userId = internalUserContext.getUserId();
            byte[] imageBytes = usuarioFotoStorage.loadImageForUser(userId);
            if (imageBytes == null || imageBytes.length == 0) {
                return Response.status(Response.Status.NOT_FOUND).build();
            }
            Usuario usuario = Usuario.findById(userId);
            String contentType = fotoContentType(usuario != null ? usuario.fotoPerfil : null);
            return Response.ok(imageBytes)
                    .type(contentType)
                    .header("Cache-Control", "private, max-age=120")
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
    }

    private static String fotoContentType(String filename) {
        if (filename == null) {
            return "image/jpeg";
        }
        String lower = filename.toLowerCase();
        if (lower.endsWith(".png")) {
            return "image/png";
        }
        if (lower.endsWith(".gif")) {
            return "image/gif";
        }
        if (lower.endsWith(".webp")) {
            return "image/webp";
        }
        return "image/jpeg";
    }

    @OPTIONS
    @Path("/login")
    public Response loginOptions(@Context ContainerRequestContext requestContext) {
        String origin = requestContext.getHeaderString("Origin");
        String originHeader = origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1")
                || origin.contains("4200") || origin.contains("8081")) ? origin : "*";

        return Response.ok()
            .header("Access-Control-Allow-Origin", originHeader)
            .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
            .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control, Last-Event-ID")
            .header("Access-Control-Allow-Credentials", "true")
            .header("Access-Control-Max-Age", "3600")
            .build();
    }

    @GET
    @Path("/login-tenants")
    public List<TenantLoginOptionDto> listLoginTenants(@QueryParam("email") String email) {
        if (email == null || email.trim().isEmpty()) {
            return List.of();
        }
        return authService.listLoginTenantsForEmail(email.trim());
    }

    @POST
    @Path("/login")
    public Response login(LoginRequest request, @Context ContainerRequestContext ctx) {
        if (authService == null) {
            LOG.error("AuthService not available");
            return Response.status(Response.Status.SERVICE_UNAVAILABLE)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_SERVICE_UNAVAILABLE)))
                    .build();
        }
        if (request == null) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_INVALID_REQUEST)))
                    .build();
        }

        String ip = clientIp(ctx);
        String userAgent = ctx.getHeaderString("User-Agent");
        try {
            LoginResponse response = authService.login(request, ip, userAgent);
            return Response.ok(response).build();
        } catch (AuthMfaException e) {
            authService.recordLoginFailure(request, e.code, ip, userAgent);
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of(
                            "code", e.code,
                            "message", e.getMessage(),
                            "mfaSetupToken", e.mfaSetupToken != null ? e.mfaSetupToken : ""))
                    .build();
        } catch (AuthLoginException e) {
            authService.recordLoginFailure(request, e.code, ip, userAgent);
            int status = "MFA_REQUIRED".equals(e.code)
                    ? Response.Status.UNAUTHORIZED.getStatusCode()
                    : Response.Status.UNAUTHORIZED.getStatusCode();
            return Response.status(status)
                    .entity(new ErrorResponse(AuthI18nCodes.encodedMessage(e.code), e.code))
                    .build();
        } catch (RuntimeException e) {
            authService.recordLoginFailure(request, "INVALID_CREDENTIALS", ip, userAgent);
            LOG.debugf(e, "Login failed");
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.encode(ApiI18nMessages.AUTH_INVALID_CREDENTIALS),
                            "INVALID_CREDENTIALS"))
                    .build();
        } catch (Exception e) {
            LOG.error("Unexpected login error", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.COMMON_INTERNAL_ERROR)))
                    .build();
        }
    }

    @POST
    @Path("/forgot-password")
    public Response forgotPassword(ForgotPasswordRequest request) {
        try {
            if (request == null || request.email == null || request.email.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_EMAIL_REQUIRED)))
                        .build();
            }

            String email = request.email.trim().toLowerCase();
            String tenantCodigo = request.tenantCodigo != null ? request.tenantCodigo.trim() : null;
            MessageResponse response = authService.requestPasswordReset(email, tenantCodigo);
            return Response.ok(response).build();
        } catch (AuthLoginException e) {
            if ("TENANT_REQUIRED".equals(e.code) || "TENANT_NOT_FOUND".equals(e.code)) {
                String email = request != null ? request.email : null;
                String tenant = request != null ? request.tenantCodigo : null;
                accessAuditService.loginFailure(
                        email, tenant, e.code, null, null, "/api/auth/forgot-password");
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(AuthI18nCodes.encodedMessage(e.code), e.code))
                        .build();
            }
            return Response.ok(new MessageResponse(
                    ApiI18nMessages.encode(ApiI18nMessages.AUTH_FORGOT_PASSWORD_ACK)))
                    .build();
        } catch (Exception e) {
            LOG.error("Forgot password failed", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PROCESS_REQUEST_FAILED)))
                    .build();
        }
    }

    @GET
    @Path("/validate-reset-token/{token}")
    public Response validateResetToken(@PathParam("token") String token) {
        try {
            if (token == null || token.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TOKEN_REQUIRED)))
                        .build();
            }

            TokenValidationResponse response = authService.validateResetToken(token);
            return Response.ok(response).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_VALIDATE_TOKEN_FAILED)))
                    .build();
        }
    }

    @POST
    @Path("/reset-password")
    public Response resetPassword(ResetPasswordRequest request) {
        try {
            if (request == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_INVALID_REQUEST)))
                        .build();
            }
            if (request.token == null || request.token.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TOKEN_REQUIRED)))
                        .build();
            }
            if (request.newPassword == null || request.newPassword.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_NEW_PASSWORD_REQUIRED)))
                        .build();
            }

            MessageResponse response = authService.resetPassword(request.token, request.newPassword);
            return Response.ok(response).build();
        } catch (RuntimeException e) {
            LOG.debugf(e, "Reset password rejected");
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.messageOrFallback(ApiI18nMessages.AUTH_RESET_FAILED, e.getMessage())))
                    .build();
        } catch (Exception e) {
            LOG.error("Reset password failed", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_RESET_FAILED)))
                    .build();
        }
    }

    @POST
    @Path("/validate-current-password")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response validateCurrentPassword(ValidateCurrentPasswordRequest request) {
        try {
            if (request == null || request.email == null || request.email.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_EMAIL_REQUIRED)))
                    .build();
            }

            if (request.currentPassword == null || request.currentPassword.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_CURRENT_PASSWORD_REQUIRED)))
                    .build();
            }

            MessageResponse response = authService.validateCurrentPassword(
                request.email.trim().toLowerCase(),
                request.currentPassword
            );
            return Response.ok(response).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse(
                        ApiI18nMessages.messageOrFallback(
                                ApiI18nMessages.AUTH_CURRENT_PASSWORD_WRONG, e.getMessage())))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(
                        ApiI18nMessages.encode(ApiI18nMessages.AUTH_VALIDATE_CURRENT_PASSWORD_FAILED)))
                .build();
        }
    }

    @POST
    @Path("/change-password-new-user")
    @Consumes(MediaType.APPLICATION_JSON)
    @Produces(MediaType.APPLICATION_JSON)
    public Response changePasswordForNewUser(ChangePasswordForNewUserRequest request) {
        try {
            if (request == null || request.email == null || request.email.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_EMAIL_REQUIRED)))
                    .build();
            }

            if (request.senhaTemporaria == null || request.senhaTemporaria.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TEMP_PASSWORD_REQUIRED)))
                    .build();
            }

            if (request.novaSenha == null || request.novaSenha.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_NEW_PASSWORD_REQUIRED)))
                    .build();
            }

            LoginResponse response = authService.changePasswordForNewUser(
                request.email.trim().toLowerCase(),
                request.senhaTemporaria,
                request.novaSenha
            );
            return Response.ok(response).build();
        } catch (RuntimeException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse(
                        ApiI18nMessages.messageOrFallback(
                                ApiI18nMessages.AUTH_CHANGE_PASSWORD_FAILED, e.getMessage())))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_CHANGE_PASSWORD_FAILED)))
                .build();
        }
    }

    @GET
    @Path("/test")
    public Response test() {
        if (LaunchMode.current() == LaunchMode.NORMAL) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        return Response.ok(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TEST_ENDPOINT_OK)).build();
    }

    @POST
    @Path("/refresh-oauth2-token")
    public Response refreshOAuth2Token() {
        if (LaunchMode.current() == LaunchMode.NORMAL) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        try {
            var scheduler = jakarta.enterprise.inject.spi.CDI.current()
                .select(com.aerosuite.service.OAuth2TokenRefreshScheduler.class)
                .get();

            scheduler.forceRefresh();

            return Response.ok(new MessageResponse(
                    ApiI18nMessages.encode(ApiI18nMessages.AUTH_OAUTH_REFRESH_SUCCESS))).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.withDetail(ApiI18nMessages.AUTH_OAUTH_REFRESH_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/users")
    @RequiresFuncionalidades(allOf = {"GERENCIAR_PERMISSOES"})
    public Response getUsers() {
        try {
            var users = com.aerosuite.domain.Usuario.listAll();
            return Response.ok(users).build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.withDetail(ApiI18nMessages.AUTH_LIST_USERS_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    @Path("/create-user")
    @RequiresFuncionalidades(allOf = {"GERENCIAR_PERMISSOES"})
    public Response createUser() {
        if (LaunchMode.current() == LaunchMode.NORMAL) {
            return Response.status(Response.Status.NOT_FOUND).build();
        }
        try {
            var existingUser = com.aerosuite.domain.Usuario.find("email = ?1", "admin@aerosuite.com").firstResult();
            if (existingUser == null) {
                var user = new com.aerosuite.domain.Usuario();
                user.email = "admin@aerosuite.com";
                user.nome = "Administrador";
                user.senha = com.aerosuite.security.PasswordCredentials.hash("admin123");
                user.dataCadastro = LocalDate.now();
                user.orgTenantId = com.aerosuite.domain.TenantConstants.DEFAULT_TENANT_ID;
                user.persist();

                return Response.ok(ApiI18nMessages.encode(ApiI18nMessages.AUTH_ADMIN_USER_CREATED)).build();
            } else {
                return Response.ok(ApiI18nMessages.encode(ApiI18nMessages.AUTH_ADMIN_USER_EXISTS)).build();
            }
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.withDetail(ApiI18nMessages.AUTH_CREATE_USER_FAILED, e.getMessage())))
                    .build();
        }
    }

    @GET
    @Path("/mfa/status")
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public MfaStatusResponse mfaStatus() {
        Usuario usuario = Usuario.findById(internalUserContext.getUserId());
        if (usuario == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND_OR_INACTIVE));
        }
        return mfaAuthService.statusForUser(usuario);
    }

    @POST
    @Path("/mfa/setup")
    public MfaSetupResponse mfaSetup(@Context ContainerRequestContext ctx) {
        Usuario usuario = resolveUsuarioForMfa(ctx);
        String issuer = ctx.getHeaderString("X-Tenant-Name");
        if (issuer == null || issuer.isBlank()) {
            issuer = environmentLabelService.mfaIssuer();
        }
        return mfaAuthService.beginSetup(usuario, issuer);
    }

    @POST
    @Path("/mfa/confirm")
    public Response mfaConfirm(MfaConfirmRequest request, @Context ContainerRequestContext ctx) {
        Usuario usuario = resolveUsuarioForMfa(ctx);
        LoginResponse response = mfaAuthService.confirmSetup(usuario, request);
        return Response.ok(response).build();
    }

    @POST
    @Path("/mfa/disable")
    @RequiresFuncionalidades(onlyAuthenticated = true)
    public Response mfaDisable(MfaConfirmRequest request) {
        Usuario usuario = Usuario.findById(internalUserContext.getUserId());
        if (usuario == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND_OR_INACTIVE));
        }
        mfaAuthService.disableForUser(usuario, request);
        return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_MFA_DISABLED))).build();
    }

    private Usuario resolveUsuarioForMfa(ContainerRequestContext ctx) {
        if (internalUserContext.isAuthenticated() && internalUserContext.getUserId() != null) {
            Usuario usuario = Usuario.findById(internalUserContext.getUserId());
            if (usuario != null) {
                return usuario;
            }
        }
        String authHeader = ctx.getHeaderString("Authorization");
        if (authHeader != null && authHeader.startsWith("Bearer ")) {
            return mfaAuthService.resolveUserFromMfaSetupToken(authHeader.substring(7).trim());
        }
        throw new NotAuthorizedException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_TOKEN_INVALID));
    }

    private static String clientIp(ContainerRequestContext ctx) {
        String ip = ctx.getHeaderString("X-Forwarded-For");
        if (ip == null || ip.isBlank()) {
            ip = ctx.getHeaderString("X-Real-IP");
        }
        if (ip != null && ip.contains(",")) {
            ip = ip.split(",")[0].trim();
        }
        return ip;
    }

    public static class ErrorResponse {
        public String message;
        public String code;

        public ErrorResponse() {}

        public ErrorResponse(String message) {
            this.message = message;
        }

        public ErrorResponse(String message, String code) {
            this.message = message;
            this.code = code;
        }
    }
}
