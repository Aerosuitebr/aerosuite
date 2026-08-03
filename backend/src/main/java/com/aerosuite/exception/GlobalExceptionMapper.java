package com.aerosuite.exception;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.i18n.I18nMessageCodec;
import com.aerosuite.integration.evolution.EvolutionApiException;
import org.jboss.logging.Logger;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import jakarta.ws.rs.WebApplicationException;
import jakarta.ws.rs.core.MediaType;
import jakarta.ws.rs.core.Response;
import jakarta.ws.rs.ext.ExceptionMapper;
import jakarta.ws.rs.ext.Provider;
import java.util.LinkedHashMap;
import java.util.Locale;
import java.util.Map;

@Provider
public class GlobalExceptionMapper implements ExceptionMapper<Exception> {

    private static final Logger LOG = Logger.getLogger(GlobalExceptionMapper.class);

    /** Chave i18n: segmentos com ponto, sem espaços (ex.: crs.error.segregation.executor). */
    static boolean isI18nKey(String message) {
        if (message == null || message.isBlank() || message.length() > 120 || message.contains(" ")) {
            return false;
        }
        return message.matches("^[a-z][a-z0-9_]*(\\.[a-z0-9_]+)+$");
    }

    private static String normalizeMessage(String message) {
        if (message == null || message.isBlank()) {
            return message;
        }
        if (I18nMessageCodec.isEncoded(message)) {
            return message;
        }
        if (isI18nKey(message)) {
            return I18nMessageCodec.encode(message);
        }
        return message;
    }

    private static Map<String, Object> errorEntity(String message, String defaultErrorLabel) {
        Map<String, Object> body = new LinkedHashMap<>();
        if (isI18nKey(message)) {
            body.put("error", message);
            body.put("message", message);
            body.put("code", message);
            return body;
        }
        String normalized = normalizeMessage(message);
        if (normalized != null && I18nMessageCodec.isEncoded(normalized)) {
            body.put("error", defaultErrorLabel);
            body.put("message", normalized);
        } else {
            body.put("error", defaultErrorLabel);
            body.put("message", message != null ? message : defaultErrorLabel);
        }
        return body;
    }

    private static Response.ResponseBuilder cors(Response.ResponseBuilder builder) {
        return builder
                .header("Access-Control-Allow-Origin", "*")
                .header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH")
                .header("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With, Accept, Origin, Cache-Control")
                .header("Access-Control-Allow-Credentials", "true");
    }

    @Override
    public Response toResponse(Exception exception) {
        // Validação (ex.: razão social obrigatória) -> 400
        if (exception instanceof IllegalArgumentException) {
            String msg = exception.getMessage();
            return cors(Response.status(Response.Status.BAD_REQUEST))
                    .type(MediaType.APPLICATION_JSON)
                    .entity(errorEntity(
                            msg != null ? msg : ApiI18nMessages.encode(ApiI18nMessages.COMMON_BAD_REQUEST),
                            ApiI18nMessages.encode(ApiI18nMessages.COMMON_VALIDATION)))
                    .build();
        }

        if (exception instanceof IllegalStateException) {
            String msg = exception.getMessage();
            return cors(Response.status(Response.Status.BAD_REQUEST))
                    .type(MediaType.APPLICATION_JSON)
                    .entity(errorEntity(
                            msg != null ? msg : ApiI18nMessages.encode(ApiI18nMessages.COMMON_OPERATION_ERROR),
                            ApiI18nMessages.encode(ApiI18nMessages.COMMON_VALIDATION)))
                    .build();
        }

        // NotFoundException -> 404
        if (exception instanceof NotFoundException) {
            String msg = exception.getMessage();
            return cors(Response.status(Response.Status.NOT_FOUND))
                    .type(MediaType.APPLICATION_JSON)
                    .entity(
                            errorEntity(
                                    msg != null
                                    ? msg
                                    : ApiI18nMessages.encode(ApiI18nMessages.COMMON_RESOURCE_NOT_FOUND),
                                    ApiI18nMessages.encode(ApiI18nMessages.COMMON_RESOURCE_NOT_FOUND)))
                    .build();
        }

        if (exception instanceof ForbiddenException) {
            String msg = exception.getMessage();
            return cors(Response.status(Response.Status.FORBIDDEN))
                    .type(MediaType.APPLICATION_JSON)
                    .entity(
                            errorEntity(
                                    msg != null
                                            ? msg
                                            : ApiI18nMessages.encode(ApiI18nMessages.COMMON_OPERATION_NOT_ALLOWED),
                                    ApiI18nMessages.encode(ApiI18nMessages.COMMON_FORBIDDEN)))
                    .build();
        }

        if (exception instanceof java.lang.SecurityException) {
            String msg = exception.getMessage();
            return cors(Response.status(Response.Status.FORBIDDEN))
                    .type(MediaType.APPLICATION_JSON)
                    .entity(
                            errorEntity(
                                    msg != null ? msg : ApiI18nMessages.encode(ApiI18nMessages.COMMON_FORBIDDEN),
                                    ApiI18nMessages.encode(ApiI18nMessages.COMMON_FORBIDDEN)))
                    .build();
        }

        if (exception instanceof BadRequestException) {
            String msg = exception.getMessage();
            return cors(Response.status(Response.Status.BAD_REQUEST))
                    .type(MediaType.APPLICATION_JSON)
                    .entity(
                            errorEntity(
                                    msg != null ? msg : ApiI18nMessages.encode(ApiI18nMessages.COMMON_BAD_REQUEST),
                                    ApiI18nMessages.encode(ApiI18nMessages.COMMON_BAD_REQUEST)))
                    .build();
        }

        if (exception instanceof WebApplicationException wae) {
            Response r = wae.getResponse();
            if (r != null) {
                return cors(Response.fromResponse(r)).build();
            }
        }

        if (exception instanceof EvolutionApiException evo) {
            String i18n = mapEvolutionApiException(evo);
            int status = evo.getHttpStatus() >= 400 && evo.getHttpStatus() < 600
                    ? evo.getHttpStatus()
                    : Response.Status.BAD_GATEWAY.getStatusCode();
            return cors(Response.status(status))
                    .type(MediaType.APPLICATION_JSON)
                    .entity(errorEntity(i18n, ApiI18nMessages.encode(ApiI18nMessages.WHATSAPP_EVOLUTION_CONNECT_ERROR)))
                    .build();
        }

        if (exception instanceof jakarta.persistence.PersistenceException
                || exception.getClass().getName().contains("ConstraintViolationException")) {
            String safe = sanitizeInternalErrorMessage(exception.getMessage());
            return cors(Response.status(Response.Status.BAD_REQUEST))
                    .type(MediaType.APPLICATION_JSON)
                    .entity(errorEntity(safe, ApiI18nMessages.encode(ApiI18nMessages.COMMON_VALIDATION)))
                    .build();
        }

        // Outros erros -> 500 (nunca expor SQL/JDBC/Hibernate ao cliente — OWASP CWE-209)
        LOG.warnf(exception, "Erro inesperado");
        String safeMessage = sanitizeInternalErrorMessage(exception.getMessage());
        return cors(Response.status(Response.Status.INTERNAL_SERVER_ERROR))
                .type(MediaType.APPLICATION_JSON)
                .entity(
                        errorEntity(
                                safeMessage != null
                                        ? safeMessage
                                        : ApiI18nMessages.encode(ApiI18nMessages.COMMON_UNEXPECTED_ERROR),
                                ApiI18nMessages.encode(ApiI18nMessages.COMMON_INTERNAL_ERROR)))
                .build();
    }

    static String sanitizeInternalErrorMessage(String message) {
        if (message == null || message.isBlank()) {
            return ApiI18nMessages.encode(ApiI18nMessages.COMMON_UNEXPECTED_ERROR);
        }
        String lower = message.toLowerCase(Locale.ROOT);
        if (lower.contains("could not execute")
                || lower.contains("data truncation")
                || lower.contains("sql")
                || lower.contains("jdbc")
                || lower.contains("hibernate")
                || lower.contains("constraint")
                || lower.contains("duplicate entry")
                || lower.contains("syntax error")
                || lower.contains("org.hibernate")
                || lower.contains("com.mysql")) {
            return ApiI18nMessages.encode(ApiI18nMessages.COMMON_UNEXPECTED_ERROR);
        }
        if (isI18nKey(message) || I18nMessageCodec.isEncoded(message)) {
            return message;
        }
        return ApiI18nMessages.encode(ApiI18nMessages.COMMON_UNEXPECTED_ERROR);
    }

    private static String mapEvolutionApiException(EvolutionApiException e) {
        String raw = e.getMessage() != null ? e.getMessage().toLowerCase(Locale.ROOT) : "";
        if (raw.contains("timeout")) {
            return ApiI18nMessages.encode(ApiI18nMessages.WHATSAPP_EVOLUTION_TIMEOUT);
        }
        if (raw.contains("connection failed") || raw.contains("not configured")) {
            return ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_SERVICE_UNAVAILABLE);
        }
        if (e.isInstanceDisconnected()) {
            return ApiI18nMessages.encode(ApiI18nMessages.EVOLUTION_INSTANCE_DISCONNECTED);
        }
        return ApiI18nMessages.withDetail(ApiI18nMessages.WHATSAPP_EVOLUTION_SEND_FAILED, e.getMessage());
    }
}

