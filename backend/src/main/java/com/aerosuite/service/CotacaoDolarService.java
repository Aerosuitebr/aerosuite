package com.aerosuite.service;

import com.aerosuite.dto.CotacaoDolarDto;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.ServiceUnavailableException;

import java.math.BigDecimal;
import java.net.URI;
import java.net.URLEncoder;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.nio.charset.StandardCharsets;
import java.time.Duration;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.Locale;

/**
 * Cotação PTAX (venda) via API pública do Banco Central.
 * Sem fallback silencioso para 5,00 — se a PTAX não estiver disponível, falha de forma explícita.
 */
@ApplicationScoped
public class CotacaoDolarService {

    private static final DateTimeFormatter BCB_QUERY = DateTimeFormatter.ofPattern("MM-dd-yyyy");
    private static final ObjectMapper MAPPER = new ObjectMapper();

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(12))
            .followRedirects(HttpClient.Redirect.NORMAL)
            .build();

    private volatile CotacaoDolarDto cache;
    private volatile long cacheAtMs;

    public CotacaoDolarDto obterCotacaoAtual() {
        long now = System.currentTimeMillis();
        if (cache != null && (now - cacheAtMs) < 15 * 60 * 1000L) {
            return cache;
        }
        CotacaoDolarDto fresh = buscarComRetrocesso(LocalDate.now(), 0);
        cache = fresh;
        cacheAtMs = now;
        return fresh;
    }

    public void limparCache() {
        cache = null;
        cacheAtMs = 0;
    }

    private CotacaoDolarDto buscarComRetrocesso(LocalDate base, int tentativa) {
        if (tentativa > 7) {
            throw new ServiceUnavailableException(
                    "Cotação PTAX do dólar indisponível no Banco Central. "
                            + "Não é seguro usar valor estimado. Tente novamente em instantes.");
        }
        LocalDate dia = base.minusDays(tentativa);
        try {
            CotacaoDolarDto dto = buscarDia(dia);
            if (dto != null) {
                return dto;
            }
        } catch (ServiceUnavailableException e) {
            throw e;
        } catch (Exception e) {
            System.err.println("CotacaoDolarService: falha em " + dia + ": " + e.getMessage());
        }
        return buscarComRetrocesso(base, tentativa + 1);
    }

    private CotacaoDolarDto buscarDia(LocalDate dia) throws Exception {
        String data = BCB_QUERY.format(dia);
        String encoded = URLEncoder.encode("'" + data + "'", StandardCharsets.UTF_8);
        String url = "https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/"
                + "CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao=" + encoded
                + "&$top=100&$orderby=dataHoraCotacao%20desc&$format=json";

        HttpRequest req = HttpRequest.newBuilder(URI.create(url))
                .timeout(Duration.ofSeconds(20))
                .header("Accept", "application/json")
                .GET()
                .build();
        HttpResponse<String> resp = http.send(req, HttpResponse.BodyHandlers.ofString(StandardCharsets.UTF_8));
        if (resp.statusCode() >= 400) {
            throw new IllegalStateException("BCB HTTP " + resp.statusCode());
        }
        JsonNode root = MAPPER.readTree(resp.body());
        JsonNode values = root.get("value");
        if (values == null || !values.isArray() || values.isEmpty()) {
            return null;
        }
        JsonNode ultima = values.get(0);
        CotacaoDolarDto dto = new CotacaoDolarDto();
        dto.cotacaoCompra = asDecimal(ultima.get("cotacaoCompra"));
        dto.cotacaoVenda = asDecimal(ultima.get("cotacaoVenda"));
        dto.dataHoraCotacao = parseDataHora(ultima.get("dataHoraCotacao"));
        dto.fonte = "Banco Central do Brasil (PTAX)";
        dto.estimada = false;
        dto.dataCotacaoConsulta = dia.toString();
        if (dto.cotacaoVenda == null || dto.cotacaoVenda.compareTo(BigDecimal.ZERO) <= 0) {
            return null;
        }
        return dto;
    }

    private static BigDecimal asDecimal(JsonNode n) {
        if (n == null || n.isNull()) return null;
        if (n.isNumber()) return n.decimalValue();
        try {
            return new BigDecimal(n.asText().trim().replace(',', '.'));
        } catch (Exception e) {
            return null;
        }
    }

    private static LocalDateTime parseDataHora(JsonNode n) {
        if (n == null || n.isNull()) return LocalDateTime.now();
        String raw = n.asText().trim();
        if (raw.isEmpty()) return LocalDateTime.now();
        String[] patterns = {
                "yyyy-MM-dd HH:mm:ss.SSSSSS",
                "yyyy-MM-dd HH:mm:ss.SSS",
                "yyyy-MM-dd HH:mm:ss",
                "yyyy-MM-dd'T'HH:mm:ss"
        };
        for (String p : patterns) {
            try {
                return LocalDateTime.parse(raw.replace(" UTC", "").trim(),
                        DateTimeFormatter.ofPattern(p, Locale.ROOT));
            } catch (DateTimeParseException ignored) {
            }
        }
        try {
            return LocalDateTime.parse(raw.substring(0, Math.min(19, raw.length())).replace(' ', 'T'));
        } catch (Exception e) {
            return LocalDateTime.now();
        }
    }
}
