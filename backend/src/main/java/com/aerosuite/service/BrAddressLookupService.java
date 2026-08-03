package com.aerosuite.service;

import com.aerosuite.dto.br.CepLookupDto;
import com.aerosuite.dto.br.CnpjLookupDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import org.jboss.logging.Logger;

import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.util.Locale;
import java.util.Optional;

/**
 * Consulta CEP/CNPJ em APIs públicas brasileiras (server-side, evita CORS no browser).
 */
@ApplicationScoped
public class BrAddressLookupService {

    private static final Logger LOG = Logger.getLogger(BrAddressLookupService.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public Optional<CepLookupDto> lookupCep(String cep) {
        String digits = digitsOnly(cep);
        if (digits.length() != 8) {
            return Optional.empty();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://viacep.com.br/ws/" + digits + "/json/"))
                    .timeout(Duration.ofSeconds(12))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                return Optional.empty();
            }
            JsonNode root = MAPPER.readTree(response.body());
            if (root.path("erro").asBoolean(false)) {
                return Optional.empty();
            }
            String localidade = root.path("localidade").asText("").trim();
            String uf = root.path("uf").asText("").trim();
            if (localidade.isEmpty() || uf.isEmpty()) {
                return Optional.empty();
            }
            CepLookupDto dto = new CepLookupDto();
            dto.cep = formatCep(digits);
            dto.logradouro = root.path("logradouro").asText("").trim();
            dto.bairro = root.path("bairro").asText("").trim();
            dto.cidade = localidade;
            dto.uf = uf.toUpperCase(Locale.ROOT);
            String complemento = root.path("complemento").asText("").trim();
            if (!complemento.isEmpty()) {
                dto.complemento = complemento;
            }
            return Optional.of(dto);
        } catch (Exception e) {
            LOG.warnf(e, "ViaCEP lookup failed for cep=%s", digits);
            return Optional.empty();
        }
    }

    public Optional<CnpjLookupDto> lookupCnpj(String cnpj) {
        String digits = digitsOnly(cnpj);
        if (digits.length() != 14) {
            return Optional.empty();
        }
        try {
            HttpRequest request = HttpRequest.newBuilder()
                    .uri(URI.create("https://brasilapi.com.br/api/cnpj/v1/" + digits))
                    .timeout(Duration.ofSeconds(15))
                    .header("Accept", "application/json")
                    .GET()
                    .build();
            HttpResponse<String> response = http.send(request, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
            if (response.statusCode() != 200) {
                return Optional.empty();
            }
            JsonNode root = MAPPER.readTree(response.body());
            String razaoSocial = root.path("razao_social").asText("").trim();
            if (razaoSocial.isEmpty()) {
                return Optional.empty();
            }
            CnpjLookupDto dto = new CnpjLookupDto();
            dto.razaoSocial = razaoSocial;
            putIfPresent(root, "nome_fantasia", v -> dto.nomeFantasia = v);
            putIfPresent(root, "logradouro", v -> dto.logradouro = v);
            putIfPresent(root, "numero", v -> dto.numero = v);
            putIfPresent(root, "complemento", v -> dto.complemento = v);
            putIfPresent(root, "bairro", v -> dto.bairro = v);
            putIfPresent(root, "municipio", v -> dto.cidade = v);
            String uf = root.path("uf").asText("").trim();
            if (!uf.isEmpty()) {
                dto.uf = uf.toUpperCase(Locale.ROOT);
            }
            String cepRaw = root.path("cep").asText("").trim();
            if (!cepRaw.isEmpty()) {
                dto.cep = formatCep(cepRaw);
            }
            String tel = digitsOnly(root.path("ddd_telefone_1").asText(""));
            if (!tel.isEmpty()) {
                dto.telefone = tel;
            }
            putIfPresent(root, "email", v -> dto.email = v);
            return Optional.of(dto);
        } catch (Exception e) {
            LOG.warnf(e, "Brasil API CNPJ lookup failed for cnpj=%s", digits);
            return Optional.empty();
        }
    }

    private static void putIfPresent(JsonNode root, String field, java.util.function.Consumer<String> setter) {
        String value = root.path(field).asText("").trim();
        if (!value.isEmpty()) {
            setter.accept(value);
        }
    }

    static String digitsOnly(String value) {
        if (value == null || value.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder(value.length());
        for (int i = 0; i < value.length(); i++) {
            char c = value.charAt(i);
            if (c >= '0' && c <= '9') {
                sb.append(c);
            }
        }
        return sb.toString();
    }

    static String formatCep(String digits) {
        String d = digitsOnly(digits);
        if (d.length() != 8) {
            return d;
        }
        return d.substring(0, 5) + '-' + d.substring(5);
    }
}
