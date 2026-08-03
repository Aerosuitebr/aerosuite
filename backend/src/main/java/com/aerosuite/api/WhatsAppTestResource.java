package com.aerosuite.api;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.WhatsAppService;
import com.aerosuite.security.RequiresFuncionalidades;
import io.quarkus.arc.profile.UnlessBuildProfile;
import jakarta.inject.Inject;
import jakarta.ws.rs.*;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import org.jboss.logging.Logger;

import java.util.Map;

/**
 * Resource para testar envio de mensagens WhatsApp
 */
@UnlessBuildProfile("prod")
@Path("/api/test/whatsapp")
@Produces(MediaType.APPLICATION_JSON)
@Consumes(MediaType.APPLICATION_JSON)
@jakarta.enterprise.context.ApplicationScoped
@RequiresFuncionalidades(onlyAuthenticated = true)
public class WhatsAppTestResource {

    private static final Logger LOGGER = Logger.getLogger(WhatsAppTestResource.class);

    @Inject
    WhatsAppService whatsAppService;

    @POST
    @Path("/send-text")
    public Response testSendText(@QueryParam("phone") String phoneNumber, @QueryParam("message") String message) {
        try {
            if (phoneNumber == null || phoneNumber.isBlank()) {
                return Response.status(Response.Status.BAD_REQUEST)
                        .entity(Map.of("error", ApiI18nMessages.encode(ApiI18nMessages.WHATSAPP_TEST_PHONE_REQUIRED)))
                        .build();
            }

            if (message == null || message.isBlank()) {
                message = "Evolution API send test - " + java.time.LocalDateTime.now();
            }

            LOGGER.info("🧪 TESTE: Enviando mensagem de texto para: " + phoneNumber);
            LOGGER.info("🧪 TESTE: Mensagem: " + message);

            Map<String, Object> resultado = whatsAppService.sendMessageWithPdfDetailed(phoneNumber, message, null, null);

            boolean sucesso = (Boolean) resultado.getOrDefault("success", false);
            String errorMsg = (String) resultado.getOrDefault("errorMessage", null);

            if (sucesso) {
                LOGGER.info("✅ TESTE: Mensagem enviada com sucesso!");
                return Response.ok(Map.of(
                        "success", true,
                        "message", ApiI18nMessages.encode(ApiI18nMessages.WHATSAPP_TEST_SENT_SUCCESS),
                        "phone", phoneNumber,
                        "result", resultado
                )).build();
            } else {
                LOGGER.error("❌ TESTE: Falha ao enviar mensagem: " + errorMsg);
                return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                        .entity(Map.of(
                                "success", false,
                                "error", ApiI18nMessages.messageOrFallback(
                                        ApiI18nMessages.WHATSAPP_TEST_UNKNOWN_FAILURE, errorMsg),
                                "phone", phoneNumber,
                                "result", resultado
                        ))
                        .build();
            }
        } catch (Exception e) {
            LOGGER.error("❌ TESTE: Erro ao testar envio: " + e.getMessage(), e);
            return Response.status(Response.Status.INTERNAL_SERVER_ERROR)
                    .entity(Map.of(
                            "success", false,
                            "error", ApiI18nMessages.withDetail(
                                    ApiI18nMessages.WHATSAPP_TEST_SEND_ERROR, e.getMessage())
                    ))
                    .build();
        }
    }
}
