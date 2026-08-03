package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.dto.*;
import com.aerosuite.security.AuthExternoAccessGuard;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.AccessAuditService;
import com.aerosuite.service.AuthLoginException;
import com.aerosuite.service.EmailService;
import com.aerosuite.service.PropostaExternaPortalService;
import com.aerosuite.service.UsuarioExternoService;
import com.aerosuite.util.ServerUrlUtil;
import com.aerosuite.dto.PropostaExternaDecisaoRequest;
import com.aerosuite.dto.PropostaExternaDto;
import java.util.List;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.Context;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.container.ContainerRequestContext;

/**
 * REST API para autenticação de usuários externos.
 */
@Path("/api/auth-externo")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
public class AuthExternoResource {

    private static final Logger LOG = Logger.getLogger(AuthExternoResource.class);

    @Inject
    UsuarioExternoService service;

    @Inject
    EmailService emailService;

    @Inject
    ServerUrlUtil serverUrlUtil;

    @Inject
    AuthExternoAccessGuard externoAccessGuard;

    @Inject
    AccessAuditService accessAuditService;

    @Inject
    PropostaExternaPortalService propostaExternaPortalService;

    @Inject
    com.aerosuite.service.CapacidadeFilaService capacidadeFilaService;

    @Inject
    com.aerosuite.service.PropostaPortalV11Service propostaPortalV11Service;

    @OPTIONS
    @Path("/login")
    public Response loginOptions(@Context ContainerRequestContext requestContext) {
        String origin = requestContext.getHeaderString("Origin");
        String originHeader = origin != null && (origin.contains("localhost") || origin.contains("127.0.0.1") || 
            origin.contains("4200") || origin.contains("8081")) ? origin : "*";
        
        return Response.ok()
            .header("Access-Control-Allow-Origin", originHeader)
            .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
            .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control")
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
        return service.listLoginTenantsForEmail(email.trim());
    }

    @POST
    @Path("/login")
    public Response login(LoginExternoRequest request, @Context ContainerRequestContext ctx) {
        String ip = clientIp(ctx);
        String userAgent = ctx.getHeaderString("User-Agent");
        try {
            if (request == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_INVALID_REQUEST)))
                        .build();
            }

            if (request.email == null || request.email.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_EMAIL_REQUIRED)))
                        .build();
            }

            if (request.password == null || request.password.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_REQUIRED)))
                        .build();
            }

            LoginExternoResponse response = service.login(
                    request.email, request.password, request.tenantCodigo, ip, userAgent);
            return Response.ok(response).build();

        } catch (AuthLoginException e) {
            accessAuditService.loginFailure(
                    request != null ? request.email : null,
                    request != null ? request.tenantCodigo : null,
                    e.code,
                    ip,
                    userAgent,
                    "/api/auth-externo/login");
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(e.getMessage(), e.code))
                    .build();
        } catch (RuntimeException e) {
            accessAuditService.loginFailure(
                    request != null ? request.email : null,
                    request != null ? request.tenantCodigo : null,
                    "INVALID_CREDENTIALS",
                    ip,
                    userAgent,
                    "/api/auth-externo/login");
            LOG.debugf(e, "External login failed");
            return Response.status(Response.Status.UNAUTHORIZED)
                    .entity(new ErrorResponse(e.getMessage(), "INVALID_CREDENTIALS"))
                    .build();
        } catch (Exception e) {
            LOG.error("Unexpected external login error", e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.COMMON_INTERNAL_ERROR)))
                    .build();
        }
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

    @POST
    @Path("/forgot-password")
    public Response forgotPassword(ForgotPasswordRequest request) {
        try {
            if (request == null || request.email == null || request.email.trim().isEmpty()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_EMAIL_REQUIRED)))
                        .build();
            }
            
            // Por segurança, sempre retornar sucesso mesmo se o email não existir
            String email = request.email.trim().toLowerCase();
            try {
                com.aerosuite.domain.UsuarioExterno externo =
                        com.aerosuite.domain.UsuarioExterno.findByEmailAndAtivo(email);
                if (externo != null) {
                    String token = service.createPasswordSetupTokenExterno(email);
                    String resetUrl = serverUrlUtil.getFrontendUrl() + "/externo/setup-password?token=" + token;
                    String locale = com.aerosuite.i18n.UserLocaleResolver.resolve(externo);
                    try {
                        emailService.sendPasswordResetEmailExterno(email, resetUrl, locale);
                        LOG.infof("E-mail de reset externo enviado para %s", email);
                    } catch (Exception mailEx) {
                        LOG.errorf(mailEx, "Falha ao enviar e-mail de reset externo para %s. URL (debug): %s", email, resetUrl);
                    }
                }
            } catch (Exception e) {
                LOG.debugf(e, "forgot-password externo ignorado para %s", email);
            }
            
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_FORGOT_PASSWORD_ACK))).build();
            
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.withDetail(ApiI18nMessages.AUTH_PROCESS_REQUEST_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    @Path("/reset-password")
    public Response resetPassword(ResetPasswordExternoRequest request) {
        try {
            if (request == null) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.COMMON_BODY_REQUIRED)))
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
            
            service.resetPassword(request.token, request.newPassword);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_RESET_SUCCESS))).build();
            
        } catch (RuntimeException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.AUTH_RESET_FAILED, e.getMessage())))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.withDetail(ApiI18nMessages.AUTH_RESET_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    @Path("/change-password-new-user")
    public Response changePasswordForNewUser(ChangePasswordExternoRequest request) {
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
            
            service.changePasswordForNewUser(request.email, request.senhaTemporaria, request.novaSenha);
            return Response.ok(new MessageResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_CHANGED))).build();
            
        } catch (RuntimeException e) {
            return Response.status(Response.Status.BAD_REQUEST)
                .entity(new ErrorResponse(ApiI18nMessages.messageOrFallback(ApiI18nMessages.AUTH_CHANGE_PASSWORD_FAILED, e.getMessage())))
                .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(new ErrorResponse(
                        ApiI18nMessages.withDetail(ApiI18nMessages.AUTH_CHANGE_PASSWORD_FAILED, e.getMessage())))
                .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response getUsuarioAtual(@PathParam("usuarioExternoId") Integer id) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            UsuarioExternoDto dto = service.getByIdComDetalhes(id);
            if (dto == null) {
                return Response.status(Response.Status.NOT_FOUND)
                        .entity(new ErrorResponse(ApiI18nMessages.encode(ApiI18nMessages.AUTH_USER_NOT_FOUND)))
                        .build();
            }
            return Response.ok(dto).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}/os")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response getMinhasOS(@PathParam("usuarioExternoId") Integer id) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            return Response.ok(service.getOSsUsuario(id)).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}/os/{osId}")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response getOSDetalhada(
            @PathParam("usuarioExternoId") Integer usuarioId,
            @PathParam("osId") Long osId) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(usuarioId);
            OSExternaDetalhadaDto os = service.getOSDetalhada(usuarioId, osId);
            return Response.ok(os).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (SecurityException e) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        } catch (IllegalArgumentException e) {
            return Response.status(Response.Status.NOT_FOUND)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}/documentos")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response getMeusDocumentos(@PathParam("usuarioExternoId") Integer id) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            return Response.ok(service.getDocumentosUsuario(id)).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}/capacidade")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response getCapacidadeCliente(@PathParam("usuarioExternoId") Integer id) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            return Response.ok(capacidadeFilaService.listarParaUsuarioExterno(id)).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}/propostas")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response getMinhasPropostas(@PathParam("usuarioExternoId") Integer id) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            return Response.ok(propostaExternaPortalService.listarParaUsuario(id)).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response getPropostaDetalhe(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            PropostaExternaDto dto = propostaExternaPortalService.detalhe(id, propostaId);
            return Response.ok(dto).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/imprimir")
    @Produces(MediaType.TEXT_HTML)
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response imprimirProposta(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            String html = propostaExternaPortalService.htmlImpressao(id, propostaId);
            return Response.ok(html).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(
                            ApiI18nMessages.withDetail(ApiI18nMessages.EXTERNO_PRINT_FAILED, e.getMessage())))
                    .build();
        }
    }

    @POST
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/aprovar")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response aprovarProposta(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId,
            PropostaExternaDecisaoRequest body,
            @Context ContainerRequestContext ctx) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            PropostaExternaDto dto = propostaExternaPortalService.aprovar(
                    id, propostaId, body, clientIp(ctx), ctx.getHeaderString("User-Agent"));
            return Response.ok(dto).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @POST
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/rejeitar")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response rejeitarProposta(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId,
            PropostaExternaDecisaoRequest body,
            @Context ContainerRequestContext ctx) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            PropostaExternaDto dto = propostaExternaPortalService.rejeitar(
                    id, propostaId, body, clientIp(ctx), ctx.getHeaderString("User-Agent"));
            return Response.ok(dto).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.BAD_REQUEST)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    @GET
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/aditivos")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response listarAditivos(
            @PathParam("usuarioExternoId") Integer id, @PathParam("propostaId") Long propostaId) {
        externoAccessGuard.assertCanAccessUsuarioExterno(id);
        return Response.ok(propostaPortalV11Service.listarAditivos(id, propostaId)).build();
    }

    @POST
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/aditivos")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response solicitarAditivo(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId,
            PropostaAditivoWriteDto body) {
        externoAccessGuard.assertCanAccessUsuarioExterno(id);
        return Response.status(Response.Status.CREATED)
                .entity(propostaPortalV11Service.solicitarAditivo(id, propostaId, body))
                .build();
    }

    @POST
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/aditivos/{aditivoId}/aprovar")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response aprovarAditivo(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId,
            @PathParam("aditivoId") Long aditivoId,
            PropostaExternaDecisaoRequest body) {
        externoAccessGuard.assertCanAccessUsuarioExterno(id);
        return Response.ok(propostaPortalV11Service.decidirAditivo(id, propostaId, aditivoId, true, body))
                .build();
    }

    @POST
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/aditivos/{aditivoId}/rejeitar")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response rejeitarAditivo(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId,
            @PathParam("aditivoId") Long aditivoId,
            PropostaExternaDecisaoRequest body) {
        externoAccessGuard.assertCanAccessUsuarioExterno(id);
        return Response.ok(propostaPortalV11Service.decidirAditivo(id, propostaId, aditivoId, false, body))
                .build();
    }

    @GET
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/anexos")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response listarAnexos(
            @PathParam("usuarioExternoId") Integer id, @PathParam("propostaId") Long propostaId) {
        externoAccessGuard.assertCanAccessUsuarioExterno(id);
        return Response.ok(propostaPortalV11Service.listarAnexos(id, propostaId)).build();
    }

    @POST
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/anexos")
    @Consumes(MediaType.MULTIPART_FORM_DATA)
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response enviarAnexo(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId,
            @org.jboss.resteasy.reactive.RestForm("file") org.jboss.resteasy.reactive.multipart.FileUpload file) {
        externoAccessGuard.assertCanAccessUsuarioExterno(id);
        return Response.status(Response.Status.CREATED)
                .entity(propostaPortalV11Service.enviarAnexo(id, propostaId, file))
                .build();
    }

    @GET
    @Path("/me/{usuarioExternoId}/propostas/{propostaId}/anexos/{anexoId}/download")
    @Produces(MediaType.APPLICATION_OCTET_STREAM)
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response downloadAnexo(
            @PathParam("usuarioExternoId") Integer id,
            @PathParam("propostaId") Long propostaId,
            @PathParam("anexoId") Long anexoId) {
        externoAccessGuard.assertCanAccessUsuarioExterno(id);
        var anexo = propostaPortalV11Service.requireAnexo(id, propostaId, anexoId);
        java.nio.file.Path path = propostaPortalV11Service.resolverArquivo(anexo);
        if (!java.nio.file.Files.exists(path)) {
            throw new NotFoundException(ApiI18nMessages.domain("proposta.anexo.error.nao_encontrado"));
        }
        return Response.ok(path.toFile())
                .header("Content-Disposition", "attachment; filename=\"" + anexo.nomeArquivo + "\"")
                .build();
    }

    @GET
    @Path("/me/{usuarioExternoId}/funcionalidades")
    @RequiresFuncionalidades(onlyAuthenticated = true, allowExternalLegacy = true)
    public Response getMinhasFuncionalidades(@PathParam("usuarioExternoId") Integer id) {
        try {
            externoAccessGuard.assertCanAccessUsuarioExterno(id);
            return Response.ok(service.getFuncionalidadesUsuario(id)).build();
        } catch (WebApplicationException e) {
            throw e;
        } catch (Exception e) {
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(new ErrorResponse(e.getMessage()))
                    .build();
        }
    }

    // ========================================
    // Classes auxiliares
    // ========================================

    public static class ErrorResponse {
        public String message;
        public String code;

        public ErrorResponse(String message) {
            this.message = message;
        }

        public ErrorResponse(String message, String code) {
            this.message = message;
            this.code = code;
        }
    }

    public static class ForgotPasswordRequest {
        public String email;
    }

    public static class ResetPasswordExternoRequest {
        public String token;
        public String newPassword;
    }

    public static class ChangePasswordExternoRequest {
        public String email;
        public String senhaTemporaria;
        public String novaSenha;
    }
}
