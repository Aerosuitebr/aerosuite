package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PermissionProfileService;
import com.aerosuite.security.RequiresFuncionalidades;
import com.aerosuite.service.EmailService;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;
import java.util.Set;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Endpoint REST para testar configuração de email SMTP (disponível também em produção para admins).
 */
@Path("/api/email/test")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@jakarta.enterprise.context.ApplicationScoped
@RequiresFuncionalidades(onlyAuthenticated = true)
public class EmailTestResource {

    @Inject
    EmailService emailService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    PermissionProfileService permissionProfileService;

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    Set<String> superPerfilCodigos;

    @POST
    public Response testarEmail(Map<String, String> request) {
        if (!isAdminUser()) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("sucesso", false, "erro", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ADMIN_ONLY)))
                    .build();
        }

        Map<String, Object> resultado = new HashMap<>();

        String emailDestino = request != null ? request.get("email") : null;

        if (emailDestino == null || emailDestino.trim().isEmpty()) {
            resultado.put("sucesso", false);
            resultado.put("erro", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_DESTINATION_REQUIRED));
            resultado.put("mensagem", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_DESTINATION_FORMAT_HINT));
            return Response.status(Response.Status.BAD_REQUEST).entity(resultado).build();
        }

        emailDestino = emailDestino.trim().toLowerCase();

        if (!emailDestino.matches("^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$")) {
            resultado.put("sucesso", false);
            resultado.put("erro", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_INVALID_FORMAT));
            resultado.put("email", emailDestino);
            return Response.status(Response.Status.BAD_REQUEST).entity(resultado).build();
        }

        try {
            String locale = UserLocaleResolver.resolve(internalUserContext.getUserId());
            emailService.sendTestEmail(emailDestino, locale);

            resultado.put("sucesso", true);
            resultado.put("mensagem", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_SENT_SUCCESS));
            resultado.put("email", emailDestino);
            resultado.put("instrucoes", ApiI18nMessages.encode(
                    ApiI18nMessages.EMAIL_TEST_CHECK_INBOX, "email", emailDestino));

            return Response.ok(resultado).build();

        } catch (Exception e) {
            resultado.put("sucesso", false);
            resultado.put("erro", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_SEND_FAILED));
            resultado.put("tipoErro", e.getClass().getSimpleName());
            resultado.put("mensagem", e.getMessage());
            resultado.put("email", emailDestino);

            Map<String, String> analise = new HashMap<>();
            String errorMsg = e.getMessage() != null ? e.getMessage().toLowerCase() : "";

            if (errorMsg.contains("authentication") || errorMsg.contains("auth")) {
                analise.put("tipo", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ANALYSIS_AUTH));
                analise.put("possiveisCausas", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ANALYSIS_AUTH_CAUSES));
            } else if (errorMsg.contains("connection") || errorMsg.contains("timeout") || errorMsg.contains("connect")) {
                analise.put("tipo", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ANALYSIS_CONNECTION));
                analise.put("possiveisCausas", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ANALYSIS_CONNECTION_CAUSES));
            } else if (errorMsg.contains("starttls") || errorMsg.contains("tls") || errorMsg.contains("ssl")) {
                analise.put("tipo", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ANALYSIS_TLS));
                analise.put("possiveisCausas", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ANALYSIS_TLS_CAUSES));
            } else {
                analise.put("tipo", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ANALYSIS_UNKNOWN));
                analise.put("possiveisCausas", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ANALYSIS_UNKNOWN_CAUSES));
            }

            resultado.put("analise", analise);

            if (e.getCause() != null) {
                resultado.put("causa", e.getCause().getClass().getSimpleName());
                resultado.put("mensagemCausa", e.getCause().getMessage());
            }

            return Response.status(Response.Status.INTERNAL_SERVER_ERROR).entity(resultado).build();
        }
    }

    @GET
    @Path("/config")
    public Response obterConfiguracao() {
        if (!isAdminUser()) {
            return Response.status(Response.Status.FORBIDDEN)
                    .entity(Map.of("erro", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_ADMIN_ONLY)))
                    .build();
        }

        Map<String, Object> config = new HashMap<>();
        config.put("host", "smtp.kinghost.net");
        config.put("port", 587);
        config.put("username", "noreply@aerosuite.app");
        config.put("from", "noreply@aerosuite.app");
        config.put("ssl", false);
        config.put("startTls", "REQUIRED");
        config.put("authMethods", "PLAIN,LOGIN");
        config.put("timeout", 30);

        Map<String, String> instrucoes = new HashMap<>();
        instrucoes.put("teste", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_INSTRUCTIONS_POST));
        instrucoes.put("script", ApiI18nMessages.encode(ApiI18nMessages.EMAIL_TEST_INSTRUCTIONS_SCRIPT));

        config.put("instrucoes", instrucoes);

        return Response.ok(config).build();
    }

    private boolean isAdminUser() {
        Integer userId = internalUserContext.getUserId();
        if (userId == null) {
            return false;
        }
        PermissionProfileService.PermissionSnapshot snap = permissionProfileService.loadSnapshot(userId);
        if (snap.perfilCodigo() != null && superPerfilCodigos.contains(snap.perfilCodigo().toUpperCase())) {
            return true;
        }
        return snap.funcionalidadeCodigos().contains("GERENCIAR_PERMISSOES");
    }
}
