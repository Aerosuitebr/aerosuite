package com.aerosuite.parts;

import com.aerosuite.dto.parts.PartsFinderResult;
import com.aerosuite.dto.parts.PartsFinderSearchRequest;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/** Conector para um agregador/marketplace homologado que implemente o contrato Parts Finder. */
@ApplicationScoped
public class PartnerApiPartsConnector implements PartsFinderConnector {
    private static final Logger LOG = Logger.getLogger(PartnerApiPartsConnector.class);
    private final HttpClient http = HttpClient.newBuilder().connectTimeout(Duration.ofSeconds(4)).build();

    @ConfigProperty(name = "aero.suite.parts-finder.partner.enabled", defaultValue = "false") boolean enabled;
    @ConfigProperty(name = "aero.suite.parts-finder.partner.base-url") Optional<String> baseUrl;
    @ConfigProperty(name = "aero.suite.parts-finder.partner.api-key") Optional<String> apiKey;
    @Inject ObjectMapper mapper;

    @Override public String source() { return "PARTNER_API"; }

    @Override
    public List<PartsFinderResult> search(PartsFinderSearchRequest request) {
        if (!enabled || baseUrl.isEmpty() || apiKey.isEmpty()) return List.of();
        try {
            String query = "partNumber=" + encode(request.partNumber)
                    + optional("quantity", request.quantity)
                    + optional("condition", request.condition)
                    + optional("country", request.country)
                    + optional("certification", request.certification)
                    + "&aog=" + request.aog;
            HttpRequest call = HttpRequest.newBuilder(URI.create(trimSlash(baseUrl.get()) + "/parts/search?" + query))
                    .timeout(Duration.ofSeconds(8))
                    .header("Accept", "application/json")
                    .header("Authorization", "Bearer " + apiKey.get())
                    .GET().build();
            HttpResponse<String> response = http.send(call, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() / 100 != 2) {
                LOG.warnf("Parts partner returned HTTP %d", response.statusCode());
                return List.of();
            }
            JsonNode root = mapper.readTree(response.body());
            JsonNode rows = root.isArray() ? root : root.path("results");
            if (!rows.isArray()) return List.of();
            List<PartsFinderResult> results = new ArrayList<>();
            for (JsonNode row : rows) {
                PartsFinderResult result = mapper.treeToValue(row, PartsFinderResult.class);
                result.source = source();
                results.add(result);
            }
            return results;
        } catch (Exception error) {
            LOG.warn("Parts partner lookup failed; internal inventory results remain available", error);
            return List.of();
        }
    }

    private static String optional(String name, Object value) { return value == null || value.toString().isBlank() ? "" : "&" + name + "=" + encode(value.toString()); }
    private static String encode(String value) { return URLEncoder.encode(value, StandardCharsets.UTF_8); }
    private static String trimSlash(String value) { return value.endsWith("/") ? value.substring(0, value.length() - 1) : value; }
}
