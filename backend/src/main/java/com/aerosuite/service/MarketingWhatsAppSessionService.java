package com.aerosuite.service;

import com.aerosuite.integration.evolution.EvolutionApiException;
import com.aerosuite.integration.evolution.EvolutionHttpClient;
import com.aerosuite.integration.evolution.EvolutionPlatformConfig;
import com.aerosuite.integration.evolution.dto.EvolutionConnectResponse;
import com.aerosuite.integration.evolution.dto.EvolutionCreateInstanceRequest;
import com.aerosuite.integration.evolution.dto.EvolutionCreateInstanceResponse;
import com.aerosuite.integration.evolution.dto.EvolutionSendTextRequest;
import com.fasterxml.jackson.databind.JsonNode;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.HexFormat;
import java.util.Locale;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Sessões públicas efêmeras usadas exclusivamente para contato comercial.
 *
 * <p>O visitante conecta o próprio WhatsApp, envia uma única mensagem para o
 * número comercial fixo e a instância é removida imediatamente. O cliente nunca
 * escolhe o destino nem envia texto arbitrário.
 */
@ApplicationScoped
public class MarketingWhatsAppSessionService {

    private static final SecureRandom RANDOM = new SecureRandom();
    private static final String SESSION_PATTERN = "guest_[a-f0-9]{32}";

    @Inject
    EvolutionPlatformConfig platformConfig;

    @Inject
    EvolutionHttpClient httpClient;

    @ConfigProperty(name = "aero.suite.marketing-whatsapp.enabled", defaultValue = "false")
    boolean enabled;

    @ConfigProperty(name = "aero.suite.marketing-whatsapp.destination-phone", defaultValue = "none")
    String destinationPhone;

    private final Map<String, String> instanceTokens = new ConcurrentHashMap<>();

    public SessionView start(String sessionKey) {
        ensureAvailable(sessionKey);
        String instance = instanceName(sessionKey);
        String token = resolveOrCreateToken(instance);
        JsonNode statePayload = safeConnectionState(instance);
        String state = extractState(statePayload);
        String qr = null;
        if (!"open".equalsIgnoreCase(state)) {
            EvolutionConnectResponse connect = httpClient.connectInstance(instance);
            qr = firstNonBlank(connect.base64, connect.code);
            state = firstNonBlank(state, "connecting");
        }
        return new SessionView(true, instance, state, qr, null);
    }

    public SessionView status(String sessionKey) {
        ensureAvailable(sessionKey);
        String instance = instanceName(sessionKey);
        if (!instanceTokens.containsKey(instance)) {
            return start(sessionKey);
        }
        String state = extractState(safeConnectionState(instance));
        String qr = null;
        if (!"open".equalsIgnoreCase(state)) {
            EvolutionConnectResponse connect = httpClient.connectInstance(instance);
            qr = firstNonBlank(connect.base64, connect.code);
        }
        return new SessionView(true, instance, firstNonBlank(state, "connecting"), qr, null);
    }

    public SendResult sendAndDisconnect(String sessionKey, ContactRequest request) {
        ensureAvailable(sessionKey);
        validateContact(request);
        String instance = instanceName(sessionKey);
        String state = extractState(safeConnectionState(instance));
        if (!"open".equalsIgnoreCase(state)) {
            SessionView view = status(sessionKey);
            return new SendResult(false, false, view.state(), view.qr(), "WhatsApp ainda não conectado.");
        }

        String token = resolveToken(instance);
        String message = buildMessage(request);
        httpClient.sendText(
                instance,
                token,
                new EvolutionSendTextRequest(cleanPhone(destinationPhone), message));
        boolean disconnected = disconnect(sessionKey);
        return new SendResult(true, disconnected, "closed", null, null);
    }

    public boolean disconnect(String sessionKey) {
        validateSessionKey(sessionKey);
        String instance = instanceName(sessionKey);
        boolean ok = true;
        try {
            httpClient.logoutInstance(instance);
        } catch (EvolutionApiException ignored) {
            ok = false;
        }
        try {
            httpClient.deleteInstance(instance);
            ok = true;
        } catch (EvolutionApiException ignored) {
            // Logout já revoga a sessão mesmo quando a exclusão não está disponível.
        }
        instanceTokens.remove(instance);
        return ok;
    }

    private String resolveOrCreateToken(String instance) {
        String existing = instanceTokens.get(instance);
        if (existing != null && !existing.isBlank()) {
            return existing;
        }
        var found = httpClient.findInstanceToken(instance);
        if (found.isPresent()) {
            instanceTokens.put(instance, found.get());
            return found.get();
        }
        String token = randomHex(32);
        EvolutionCreateInstanceResponse created =
                httpClient.createInstance(new EvolutionCreateInstanceRequest(instance, token));
        String resolved = created != null
                        && created.hash != null
                        && created.hash.apikey != null
                        && !created.hash.apikey.isBlank()
                ? created.hash.apikey
                : token;
        instanceTokens.put(instance, resolved);
        return resolved;
    }

    private String resolveToken(String instance) {
        String token = instanceTokens.get(instance);
        if (token != null && !token.isBlank()) {
            return token;
        }
        return httpClient.findInstanceToken(instance)
                .orElseThrow(() -> new IllegalStateException("Sessão de WhatsApp expirada."));
    }

    private JsonNode safeConnectionState(String instance) {
        try {
            return httpClient.getConnectionState(instance);
        } catch (EvolutionApiException e) {
            if (e.getHttpStatus() == 404) {
                resolveOrCreateToken(instance);
                return null;
            }
            throw e;
        }
    }

    private void ensureAvailable(String sessionKey) {
        validateSessionKey(sessionKey);
        if (!enabled || !platformConfig.isConfigured() || cleanPhone(destinationPhone).length() < 10) {
            throw new IllegalStateException("Contato por WhatsApp temporariamente indisponível.");
        }
    }

    static void validateSessionKey(String sessionKey) {
        if (sessionKey == null || !sessionKey.matches(SESSION_PATTERN)) {
            throw new IllegalArgumentException("Sessão inválida.");
        }
    }

    static void validateContact(ContactRequest request) {
        if (request == null || clean(request.name()).length() < 2) {
            throw new IllegalArgumentException("Informe seu nome.");
        }
        if (clean(request.company()).length() > 120 || clean(request.interest()).length() > 500) {
            throw new IllegalArgumentException("Dados de contato excedem o limite permitido.");
        }
    }

    static String instanceName(String sessionKey) {
        validateSessionKey(sessionKey);
        return "asmkt" + sha256(sessionKey).substring(0, 16);
    }

    private static String buildMessage(ContactRequest request) {
        StringBuilder out = new StringBuilder("Olá! Quero agendar uma apresentação da Aero Suite.");
        out.append("\n\nNome: ").append(clean(request.name()));
        if (!clean(request.company()).isBlank()) {
            out.append("\nEmpresa: ").append(clean(request.company()));
        }
        if (!clean(request.interest()).isBlank()) {
            out.append("\nInteresse: ").append(clean(request.interest()));
        }
        out.append("\n\nContato iniciado pelo site aerosuite.com.br.");
        return out.toString();
    }

    private static String clean(String value) {
        if (value == null) {
            return "";
        }
        return value.replaceAll("[\\p{Cntrl}&&[^\n\t]]", "").trim();
    }

    private static String cleanPhone(String value) {
        return value == null ? "" : value.replaceAll("\\D", "");
    }

    private static String extractState(JsonNode payload) {
        if (payload == null) {
            return null;
        }
        JsonNode instance = payload.get("instance");
        if (instance != null && instance.hasNonNull("state")) {
            return instance.get("state").asText();
        }
        return payload.hasNonNull("state") ? payload.get("state").asText() : null;
    }

    private static String firstNonBlank(String... values) {
        for (String value : values) {
            if (value != null && !value.isBlank()) {
                return value;
            }
        }
        return null;
    }

    private static String randomHex(int bytes) {
        byte[] value = new byte[bytes];
        RANDOM.nextBytes(value);
        return HexFormat.of().formatHex(value);
    }

    private static String sha256(String value) {
        try {
            return HexFormat.of().formatHex(
                    MessageDigest.getInstance("SHA-256")
                            .digest(value.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao criar sessão.", e);
        }
    }

    public record ContactRequest(String name, String company, String interest) {}

    public record SessionView(
            boolean configured, String instance, String state, String qr, String error) {}

    public record SendResult(
            boolean sent, boolean disconnected, String state, String qr, String error) {}
}
