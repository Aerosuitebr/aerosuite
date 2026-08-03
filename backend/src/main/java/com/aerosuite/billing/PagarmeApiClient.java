package com.aerosuite.billing;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ArrayNode;
import com.fasterxml.jackson.databind.node.ObjectNode;
import jakarta.enterprise.context.ApplicationScoped;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import org.jboss.logging.Logger;

@ApplicationScoped
public class PagarmeApiClient {

    private static final Logger LOG = Logger.getLogger(PagarmeApiClient.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String USER_AGENT = "aerosuite-billing/1.0";

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(20))
            .build();

    public JsonNode createSubscriptionPlan(
            String baseUrl,
            String secretKey,
            String planName,
            int amountCents,
            String interval) throws PagarmeApiException {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("name", planName);
        root.put("currency", "BRL");
        root.put("interval", interval != null && !interval.isBlank() ? interval : "month");
        root.put("interval_count", 1);
        root.put("billing_type", "prepaid");
        ArrayNode methods = root.putArray("payment_methods");
        methods.add("credit_card");
        methods.add("boleto");
        ObjectNode item = MAPPER.createObjectNode();
        item.put("name", planName);
        item.put("quantity", 1);
        ObjectNode pricing = item.putObject("pricing_scheme");
        pricing.put("price", amountCents);
        root.putArray("items").add(item);
        return post(baseUrl, secretKey, "/plans", root);
    }

    public JsonNode createSubscriptionPaymentLink(
            String baseUrl,
            String secretKey,
            String planId,
            Map<String, String> metadata) throws PagarmeApiException {
        ObjectNode root = MAPPER.createObjectNode();
        root.put("type", "subscription");
        ObjectNode paymentSettings = root.putObject("payment_settings");
        ArrayNode accepted = paymentSettings.putArray("accepted_payment_methods");
        accepted.add("credit_card");
        accepted.add("boleto");
        ObjectNode cart = root.putObject("cart_settings");
        ObjectNode recurrence = MAPPER.createObjectNode();
        recurrence.put("plan_id", planId);
        recurrence.put("start_in", 1);
        cart.putArray("recurrences").add(recurrence);
        if (metadata != null && !metadata.isEmpty()) {
            ObjectNode meta = root.putObject("metadata");
            metadata.forEach(meta::put);
        }
        return post(baseUrl, secretKey, "/paymentlinks", root);
    }

    JsonNode post(String baseUrl, String secretKey, String path, JsonNode body) throws PagarmeApiException {
        String url = normalizeBase(baseUrl) + path;
        try {
            String json = MAPPER.writeValueAsString(body);
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create(url))
                    .timeout(Duration.ofSeconds(45))
                    .header("Authorization", basicAuth(secretKey))
                    .header("Content-Type", "application/json")
                    .header("User-Agent", USER_AGENT)
                    .POST(HttpRequest.BodyPublishers.ofString(json, StandardCharsets.UTF_8))
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            JsonNode parsed = parseBody(response.body());
            if (response.statusCode() < 200 || response.statusCode() >= 300) {
                String detail = extractError(parsed, response.body());
                throw new PagarmeApiException(response.statusCode(), detail);
            }
            return parsed;
        } catch (PagarmeApiException e) {
            throw e;
        } catch (Exception e) {
            LOG.errorf(e, "Pagar.me request failed: %s", path);
            throw new PagarmeApiException(0, e.getMessage());
        }
    }

    static String basicAuth(String secretKey) {
        String token = Base64.getEncoder()
                .encodeToString((secretKey.trim() + ":").getBytes(StandardCharsets.UTF_8));
        return "Basic " + token;
    }

    static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText();
    }

    private static String normalizeBase(String baseUrl) {
        String base = baseUrl.trim();
        while (base.endsWith("/")) {
            base = base.substring(0, base.length() - 1);
        }
        return base;
    }

    private static JsonNode parseBody(String body) {
        if (body == null || body.isBlank()) {
            return MAPPER.createObjectNode();
        }
        try {
            return MAPPER.readTree(body);
        } catch (Exception e) {
            ObjectNode fallback = MAPPER.createObjectNode();
            fallback.put("raw", body.length() > 500 ? body.substring(0, 500) : body);
            return fallback;
        }
    }

    private static String extractError(JsonNode parsed, String rawBody) {
        String message = text(parsed, "message");
        if (message != null && !message.isBlank()) {
            return message;
        }
        JsonNode errors = parsed.get("errors");
        if (errors != null && errors.isArray() && !errors.isEmpty()) {
            JsonNode first = errors.get(0);
            String detail = text(first, "message");
            if (detail != null) {
                return detail;
            }
        }
        return rawBody != null && rawBody.length() <= 300 ? rawBody : "Pagar.me API error";
    }

    static boolean isSandboxKey(String secretKey) {
        return secretKey != null && secretKey.toLowerCase(Locale.ROOT).contains("_test");
    }

    static class PagarmeApiException extends Exception {
        final int statusCode;

        PagarmeApiException(int statusCode, String message) {
            super(message);
            this.statusCode = statusCode;
        }
    }
}
