package com.aerosuite.api;

import org.jboss.logging.Logger;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.EmailService;
import com.aerosuite.security.RequiresFuncionalidades;
import io.quarkus.arc.profile.UnlessBuildProfile;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.GET;
import jakarta.ws.rs.Path;
import jakarta.ws.rs.Produces;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import java.util.HashMap;
import java.util.Map;

@ApplicationScoped
@UnlessBuildProfile("prod")
@Path("/api/test-email")
@RequiresFuncionalidades(onlyAuthenticated = true)
public class TestEmailResource {

    private static final Logger LOG = Logger.getLogger(TestEmailResource.class);
    
    @Inject
    EmailService emailService;
    
    @GET
    @Produces(MediaType.APPLICATION_JSON)
    public Response testEmail() {
        Map<String, Object> result = new HashMap<>();
        
        try {
            // Verificar se EmailService está injetado
            if (emailService == null) {
                result.put("success", false);
                result.put("error", ApiI18nMessages.encode(ApiI18nMessages.TEST_EMAIL_SERVICE_MISSING));
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(result)
                    .build();
            }
            
            // Tentar enviar email de teste
            String testEmail = "teste@example.com"; // Email de teste
            String testLink = "http://localhost:4200/reset-password?token=test-token";
            
            
            emailService.sendPasswordResetEmail(testEmail, testLink);
            
            result.put("success", true);
            result.put("message", ApiI18nMessages.encode(ApiI18nMessages.TEST_EMAIL_SENT));
            result.put("testEmail", testEmail);
            result.put("note", "Verifique os logs do backend para detalhes");
            
            return Response.ok(result).build();
            
        } catch (Exception e) {
            LOG.warn("==========================================");
            LOG.warn("ERRO NO TESTE DE EMAIL");
            LOG.warn("==========================================");
            LOG.warnf(e, "Erro: %s", e.getMessage());
            LOG.warnf("Tipo: %s", e.getClass().getName());
            LOG.warnf(e, "Erro inesperado");
            LOG.warn("==========================================");
            
            result.put("success", false);
            result.put("error", e.getMessage());
            result.put("errorType", e.getClass().getName());
            result.put("stackTrace", getStackTrace(e));
            
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                .entity(result)
                .build();
        }
    }
    
    private String getStackTrace(Exception e) {
        java.io.StringWriter sw = new java.io.StringWriter();
        java.io.PrintWriter pw = new java.io.PrintWriter(sw);
        e.printStackTrace(pw);
        return sw.toString();
    }
}

