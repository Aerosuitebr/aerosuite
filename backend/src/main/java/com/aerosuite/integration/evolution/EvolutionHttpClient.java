package com.aerosuite.integration.evolution;

import com.aerosuite.integration.evolution.dto.EvolutionConnectResponse;
import com.aerosuite.integration.evolution.dto.EvolutionCreateInstanceRequest;
import com.aerosuite.integration.evolution.dto.EvolutionCreateInstanceResponse;
import com.aerosuite.integration.evolution.dto.EvolutionSendMediaRequest;
import com.aerosuite.integration.evolution.dto.EvolutionSendTextRequest;
import com.aerosuite.integration.evolution.dto.EvolutionSetWebhookRequest;
import com.fasterxml.jackson.databind.DeserializationFeature;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.core.MediaType;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import org.jboss.logging.Logger;

/**
 * Cliente HTTP de baixo nível para a Evolution API v2+.
 * Usa a chave administrativa para gestão de instâncias e o token da instância para envios.
 */
@ApplicationScoped
public class EvolutionHttpClient {

    private static final Logger LOG = Logger.getLogger(EvolutionHttpClient.class);
    private static final ObjectMapper MAPPER = new ObjectMapper()
            .configure(DeserializationFeature.FAIL_ON_UNKNOWN_PROPERTIES, false);

    @Inject
    EvolutionPlatformConfig platformConfig;

    private volatile HttpClient httpClient;

    private HttpClient client() {
        if (httpClient == null) {
            synchronized (this) {
                if (httpClient == null) {
                    httpClient = HttpClient.newBuilder()
                            .connectTimeout(Duration.ofSeconds(platformConfig.getConnectTimeoutSeconds()))
                            .build();
                }
            }
        }
        return httpClient;
    }

    public EvolutionCreateInstanceResponse createInstance(EvolutionCreateInstanceRequest request) {
        return postJson(
                "/instance/create",
                request,
                platformConfig.getAdminApiKey(),
                platformConfig.getRequestTimeoutSeconds(),
                EvolutionCreateInstanceResponse.class);
    }

    public EvolutionConnectResponse connectInstance(String instanceName) {
        return getJson(
                "/instance/connect/" + encodePath(instanceName),
                platformConfig.getAdminApiKey(),
                platformConfig.getRequestTimeoutSeconds(),
                EvolutionConnectResponse.class);
    }

    public void logoutInstance(String instanceName) {
        delete(
                "/instance/logout/" + encodePath(instanceName),
                platformConfig.getAdminApiKey(),
                platformConfig.getRequestTimeoutSeconds());
    }

    public void deleteInstance(String instanceName) {
        delete(
                "/instance/delete/" + encodePath(instanceName),
                platformConfig.getAdminApiKey(),
                platformConfig.getRequestTimeoutSeconds());
    }

    public void setWebhook(String instanceName, EvolutionSetWebhookRequest request) {
        postJsonVoid(
                "/webhook/set/" + encodePath(instanceName),
                request,
                platformConfig.getAdminApiKey(),
                platformConfig.getRequestTimeoutSeconds());
    }

    public JsonNode sendText(String instanceName, String apiKey, EvolutionSendTextRequest request) {
        return postJson(
                "/message/sendText/" + encodePath(instanceName),
                request,
                apiKey,
                platformConfig.getRequestTimeoutSeconds(),
                JsonNode.class);
    }

    /**
     * Envia mídia/anexo. O campo {@code mimetype} deve refletir o tipo real do arquivo
     * (ex.: {@code application/pdf} para OS em PDF, {@code image/jpeg} para foto de peça).
     */
    public JsonNode sendMedia(String instanceName, String apiKey, EvolutionSendMediaRequest request) {
        return postJson(
                "/message/sendMedia/" + encodePath(instanceName),
                request,
                apiKey,
                platformConfig.getMediaRequestTimeoutSeconds(),
                JsonNode.class);
    }

    /**
     * Estado atual da instância na Evolution ({@code open}, {@code close}, {@code connecting}).
     * Usado para sincronizar status quando o webhook não está acessível (ex.: dev local).
     */
    public JsonNode getConnectionState(String instanceName) {
        return getJson(
                "/instance/connectionState/" + encodePath(instanceName),
                platformConfig.getAdminApiKey(),
                platformConfig.getRequestTimeoutSeconds(),
                JsonNode.class);
    }

    /**
     * Recupera o token da instância na Evolution quando já existe (ex.: create falhou após criar na Evolution).
     */
    public java.util.Optional<String> findInstanceToken(String instanceName) {
        JsonNode instances = getJson(
                "/instance/fetchInstances",
                platformConfig.getAdminApiKey(),
                platformConfig.getRequestTimeoutSeconds(),
                JsonNode.class);
        if (instances == null || !instances.isArray()) {
            return java.util.Optional.empty();
        }
        for (JsonNode node : instances) {
            String name = null;
            if (node.hasNonNull("name")) {
                name = node.get("name").asText();
            } else if (node.hasNonNull("instanceName")) {
                name = node.get("instanceName").asText();
            }
            if (instanceName.equals(name) && node.hasNonNull("token")) {
                String token = node.get("token").asText();
                if (token != null && !token.isBlank()) {
                    return java.util.Optional.of(token);
                }
            }
        }
        return java.util.Optional.empty();
    }

    private <T> T getJson(String path, String apiKey, int timeoutSeconds, Class<T> type) {
        ensureConfigured();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(platformConfig.getApiBaseUrl() + path))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Accept", MediaType.APPLICATION_JSON)
                    .header("apikey", apiKey)
                    .GET()
                    .build();
            HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
            return parseResponse(response, type);
        } catch (EvolutionApiException e) {
            throw e;
        } catch (java.net.http.HttpTimeoutException e) {
            throw new EvolutionApiException("Evolution API timeout", e);
        } catch (java.net.ConnectException e) {
            throw new EvolutionApiException("Evolution API connection failed: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new EvolutionApiException("Evolution API request failed: " + e.getMessage(), e);
        }
    }

    private <T> T postJson(String path, Object body, String apiKey, int timeoutSeconds, Class<T> type) {
        ensureConfigured();
        try {
            String json = MAPPER.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(platformConfig.getApiBaseUrl() + path))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Content-Type", MediaType.APPLICATION_JSON)
                    .header("Accept", MediaType.APPLICATION_JSON)
                    .header("apikey", apiKey)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
            return parseResponse(response, type);
        } catch (EvolutionApiException e) {
            throw e;
        } catch (java.net.http.HttpTimeoutException e) {
            throw new EvolutionApiException("Evolution API timeout", e);
        } catch (java.net.ConnectException e) {
            throw new EvolutionApiException("Evolution API connection failed: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new EvolutionApiException("Evolution API request failed: " + e.getMessage(), e);
        }
    }

    private void postJsonVoid(String path, Object body, String apiKey, int timeoutSeconds) {
        postJson(path, body, apiKey, timeoutSeconds, JsonNode.class);
    }

    private void delete(String path, String apiKey, int timeoutSeconds) {
        ensureConfigured();
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(platformConfig.getApiBaseUrl() + path))
                    .timeout(Duration.ofSeconds(timeoutSeconds))
                    .header("Accept", MediaType.APPLICATION_JSON)
                    .header("apikey", apiKey)
                    .DELETE()
                    .build();
            HttpResponse<String> response = client().send(request, HttpResponse.BodyHandlers.ofString());
            if (response.statusCode() >= 200 && response.statusCode() < 300) {
                return;
            }
            String detail = extractErrorMessage(response.body());
            throw new EvolutionApiException(
                    "Evolution API HTTP " + response.statusCode() + ": " + detail,
                    response.statusCode());
        } catch (EvolutionApiException e) {
            throw e;
        } catch (java.net.http.HttpTimeoutException e) {
            throw new EvolutionApiException("Evolution API timeout", e);
        } catch (java.net.ConnectException e) {
            throw new EvolutionApiException("Evolution API connection failed: " + e.getMessage(), e);
        } catch (Exception e) {
            throw new EvolutionApiException("Evolution API request failed: " + e.getMessage(), e);
        }
    }

    private <T> T parseResponse(HttpResponse<String> response, Class<T> type) {
        int status = response.statusCode();
        String body = response.body() != null ? response.body() : "";
        if (status >= 200 && status < 300) {
            if (type == Void.class || body.isBlank()) {
                return null;
            }
            try {
                return MAPPER.readValue(body, type);
            } catch (Exception e) {
                throw new EvolutionApiException("Evolution API invalid JSON response: " + e.getMessage(), e);
            }
        }
        String detail = extractErrorMessage(body);
        LOG.warnf("Evolution API error HTTP %d: %s", status, detail);
        throw new EvolutionApiException("Evolution API HTTP " + status + ": " + detail, status);
    }

    private void ensureConfigured() {
        if (!platformConfig.isConfigured()) {
            throw new EvolutionApiException("Evolution API platform not configured");
        }
    }

    private static String extractErrorMessage(String body) {
        if (body == null || body.isBlank()) {
            return "";
        }
        try {
            JsonNode node = MAPPER.readTree(body);
            if (node.has("response") && node.get("response").has("message")) {
                JsonNode msg = node.get("response").get("message");
                if (msg.isArray() && !msg.isEmpty()) {
                    return msg.get(0).asText();
                }
                if (msg.isTextual()) {
                    return msg.asText();
                }
            }
            if (node.hasNonNull("message")) {
                return node.get("message").asText();
            }
            if (node.hasNonNull("error")) {
                return node.get("error").asText();
            }
            if (node.isArray() && !node.isEmpty() && node.get(0).has("message")) {
                return node.get(0).get("message").asText();
            }
        } catch (Exception ignored) {
            // usar body bruto
        }
        return body.length() > 500 ? body.substring(0, 500) + "..." : body;
    }

    private static String encodePath(String segment) {
        return java.net.URLEncoder.encode(segment, StandardCharsets.UTF_8).replace("+", "%20");
    }
}
