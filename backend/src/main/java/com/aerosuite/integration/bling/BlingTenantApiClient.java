package com.aerosuite.integration.bling;

import com.aerosuite.i18n.ApiI18nMessages;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.net.URI;
import java.net.http.HttpClient;
import java.net.http.HttpRequest;
import java.net.http.HttpResponse;
import java.time.Duration;
import java.util.Optional;

/**
 * Chamadas Bling com token explícito por tenant (webhooks, jobs, OAuth callback).
 */
@ApplicationScoped
public class BlingTenantApiClient {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Inject
    BlingPlatformConfig platformConfig;

    @Inject
    TenantBlingConnectionService tenantConnectionService;

    private final HttpClient http = HttpClient.newBuilder()
            .connectTimeout(Duration.ofSeconds(10))
            .build();

    public BlingContactDto fetchContact(long tenantId, long blingContatoId) {
        String body = get(tenantId, "/contatos/" + blingContatoId);
        try {
            return BlingContactsJsonParser.parseOne(body);
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_PARSE_CONTACT_FAILED, e.getMessage()), e);
        }
    }

    public java.util.List<BlingContactDto> searchContacts(long tenantId, String pesquisa, int limit) {
        try {
            int lim = Math.min(Math.max(limit, 1), 50);
            String path = buildContactsListPath(1, lim, null, null, pesquisa, null);
            return BlingContactsJsonParser.parse(get(tenantId, path));
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_SEARCH_CONTACTS_FAILED, e.getMessage()), e);
        }
    }

    public java.util.List<BlingContactDto> searchContactsByNome(long tenantId, String nome, int limit) {
        try {
            int lim = Math.min(Math.max(limit, 1), 50);
            String path = buildContactsListPath(1, lim, nome.trim(), null, null, null);
            return BlingContactsJsonParser.parse(get(tenantId, path));
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_SEARCH_CONTACTS_FAILED, e.getMessage()), e);
        }
    }

    public java.util.List<BlingContactDto> findContactsByDocument(long tenantId, String documento) {
        if (documento == null || documento.isBlank()) {
            return java.util.List.of();
        }
        String doc = documento.replaceAll("\\D", "");
        if (doc.isBlank()) {
            return java.util.List.of();
        }
        for (String variant : documentVariants(doc)) {
            try {
                java.util.List<BlingContactDto> bySearch = searchContacts(tenantId, variant, 10);
                if (!bySearch.isEmpty()) {
                    return bySearch;
                }
            } catch (Exception ignored) {
                // tenta próxima variante
            }
            try {
                String path = buildContactsListPath(1, 10, null, doc, null, 2);
                java.util.List<BlingContactDto> found = BlingContactsJsonParser.parse(get(tenantId, path));
                if (!found.isEmpty()) {
                    return found;
                }
            } catch (Exception ignored) {
                // tenta próxima variante
            }
        }
        try {
            String path = buildContactsListPath(1, 10, null, documento.trim(), null, null);
            return BlingContactsJsonParser.parse(get(tenantId, path));
        } catch (Exception e) {
            return java.util.List.of();
        }
    }

    private static String buildContactsListPath(
            int page,
            int limit,
            String nome,
            String numeroDocumento,
            String pesquisa,
            Integer criterio) {
        String path = "/contatos?pagina=" + page + "&limite=" + limit;
        if (nome != null && !nome.isBlank()) {
            path += "&nome=" + java.net.URLEncoder.encode(nome.trim(), java.nio.charset.StandardCharsets.UTF_8);
        }
        if (numeroDocumento != null && !numeroDocumento.isBlank()) {
            path += "&numeroDocumento="
                    + java.net.URLEncoder.encode(numeroDocumento.trim(), java.nio.charset.StandardCharsets.UTF_8);
        }
        if (pesquisa != null && !pesquisa.isBlank()) {
            path += "&pesquisa=" + java.net.URLEncoder.encode(pesquisa.trim(), java.nio.charset.StandardCharsets.UTF_8);
        }
        if (criterio != null) {
            path += "&criterio=" + criterio;
        }
        return path;
    }

    private static java.util.List<String> documentVariants(String doc) {
        java.util.List<String> variants = new java.util.ArrayList<>();
        variants.add(doc);
        if (doc.length() == 11) {
            variants.add(String.format(
                    "%s.%s.%s-%s",
                    doc.substring(0, 3),
                    doc.substring(3, 6),
                    doc.substring(6, 9),
                    doc.substring(9)));
        } else if (doc.length() == 14) {
            variants.add(String.format(
                    "%s.%s.%s/%s-%s",
                    doc.substring(0, 2),
                    doc.substring(2, 5),
                    doc.substring(5, 8),
                    doc.substring(8, 12),
                    doc.substring(12)));
        }
        return variants;
    }

    public boolean updateProductFiscalFields(long tenantId, long productId, String ncm, String unidade) {
        if (productId <= 0) {
            return false;
        }
        try {
            String body = get(tenantId, "/produtos/" + productId);
            com.fasterxml.jackson.databind.JsonNode existing = BlingProductFiscalHelper.parseProductData(body);
            if (BlingProductFiscalHelper.hasValidFiscal(existing)
                    && ncm != null
                    && ncm.trim().equals(BlingProductFiscalHelper.readNcm(existing))) {
                return true;
            }
            com.fasterxml.jackson.databind.node.ObjectNode payload =
                    BlingProductFiscalHelper.preparePutPayload(existing, ncm, unidade);
            put(tenantId, "/produtos/" + productId, MAPPER.writeValueAsString(payload));
            com.fasterxml.jackson.databind.JsonNode after =
                    BlingProductFiscalHelper.parseProductData(get(tenantId, "/produtos/" + productId));
            return BlingProductFiscalHelper.hasValidFiscal(after);
        } catch (IllegalStateException e) {
            if (isInsufficientScope(e)) {
                return false;
            }
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.BLING_CREATE_PRODUCT_FAILED, e.getMessage()), e);
        }
    }

    private static boolean isInsufficientScope(IllegalStateException e) {
        return e != null && e.getMessage() != null
                && (e.getMessage().contains("insufficient_scope") || e.getMessage().contains("HTTP 403"));
    }

    public void updateContact(long tenantId, long blingContatoId, String jsonBody) {
        put(tenantId, "/contatos/" + blingContatoId, jsonBody);
    }

    public BlingContactDto createContact(long tenantId, String jsonBody) {
        try {
            String body = post(tenantId, "/contatos", jsonBody);
            BlingContactDto created = BlingContactsJsonParser.parseOne(body);
            if (created != null && created.id != null) {
                return created;
            }
            Long id = BlingContactsJsonParser.parseCreatedId(body);
            if (id != null) {
                return fetchContact(tenantId, id);
            }
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CONTACT_ID_NOT_RETURNED));
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_CREATE_CONTACT_API_FAILED, e.getMessage()), e);
        }
    }

    public Long createProduct(long tenantId, String jsonBody) {
        try {
            String body = post(tenantId, "/produtos", jsonBody);
            JsonNode root = MAPPER.readTree(body);
            JsonNode data = root.get("data");
            if (data != null && data.has("id")) {
                return data.path("id").asLong(0);
            }
            if (root.has("id")) {
                return root.path("id").asLong(0);
            }
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_PRODUCT_ID_NOT_RETURNED));
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_CREATE_PRODUCT_FAILED, e.getMessage()), e);
        }
    }

    /** GET sem lançar exceção genérica — usado pelo probe de escopos. */
    public void probeGet(long tenantId, String path) {
        Optional<String> token = tenantConnectionService.resolveAccessToken(tenantId);
        if (token.isEmpty()) {
            throw new BlingApiException(401, ApiI18nMessages.encode(ApiI18nMessages.BLING_TENANT_NO_TOKEN, "tenantId", String.valueOf(tenantId)));
        }
        try {
            String base = normalizeBase(platformConfig.getApiBaseUrl());
            HttpRequest req = HttpRequest.newBuilder(URI.create(base + path))
                    .timeout(Duration.ofSeconds(15))
                    .header("Authorization", "Bearer " + token.get())
                    .header("Accept", "application/json")
                    .header("enable-jwt", "1")
                    .GET()
                    .build();
            HttpResponse<String> res = http.send(req, HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                throw new BlingApiException(res.statusCode(), truncate(res.body(), 200));
            }
        } catch (BlingApiException e) {
            throw e;
        } catch (Exception e) {
            throw new BlingApiException(0, e.getMessage());
        }
    }

    public static final class BlingApiException extends RuntimeException {
        public final int httpStatus;
        public final String detail;

        public BlingApiException(int httpStatus, String detail) {
            super("Bling HTTP " + httpStatus + (detail != null ? ": " + detail : ""));
            this.httpStatus = httpStatus;
            this.detail = detail;
        }
    }

    public BlingCompanyInfoDto fetchCompanyInfo(long tenantId) {
        try {
            String body = get(tenantId, "/empresas");
            JsonNode root = MAPPER.readTree(body);
            JsonNode data = root.get("data");
            if (data == null || data.isNull()) {
                return null;
            }
            JsonNode node = data.isArray() && data.size() > 0 ? data.get(0) : data;
            BlingCompanyInfoDto info = new BlingCompanyInfoDto();
            info.companyId = firstText(node, "id", "companyId");
            info.companyName = firstText(node, "nome", "razaoSocial", "nomeFantasia");
            return info;
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_FETCH_COMPANY_FAILED, e.getMessage()), e);
        }
    }

    public BlingPedidoDetailDto fetchPedidoVenda(long tenantId, long pedidoId) {
        try {
            return BlingPedidosJsonParser.parsePedido(get(tenantId, "/pedidos/vendas/" + pedidoId));
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_PARSE_PEDIDO_FAILED, e.getMessage()), e);
        }
    }

    public BlingPedidoDetailDto createPedidoVenda(long tenantId, String jsonBody) {
        try {
            String body = post(tenantId, "/pedidos/vendas", jsonBody);
            BlingPedidoDetailDto created = BlingPedidosJsonParser.parsePedido(body);
            if (created != null && created.id != null) {
                return created;
            }
            Long id = BlingPedidosJsonParser.parseCreatedPedidoId(body);
            if (id != null) {
                return fetchPedidoVenda(tenantId, id);
            }
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_PEDIDO_ID_NOT_RETURNED));
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_CREATE_PEDIDO_API_FAILED, e.getMessage()), e);
        }
    }

    public BlingNfeDetailDto fetchNfe(long tenantId, long nfeId) {
        try {
            return BlingPedidosJsonParser.parseNfe(get(tenantId, "/nfe/" + nfeId));
        } catch (IllegalStateException e) {
            if (e.getMessage() != null && e.getMessage().contains("HTTP 404")) {
                try {
                    return BlingPedidosJsonParser.parseNfe(get(tenantId, "/notas-fiscais/" + nfeId));
                } catch (Exception ignored) {
                    // fallback abaixo
                }
            }
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_PARSE_NFE_FAILED, e.getMessage()), e);
        }
    }

    public BlingNfeDetailDto createNfe(long tenantId, String jsonBody) {
        try {
            String body = post(tenantId, "/nfe", jsonBody);
            BlingNfeDetailDto created = BlingPedidosJsonParser.parseNfe(body);
            if (created != null && created.id != null) {
                return created;
            }
            Long id = BlingPedidosJsonParser.parseCreatedNfeId(body);
            if (id != null) {
                return fetchNfe(tenantId, id);
            }
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_NFE_ID_NOT_RETURNED));
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_EMIT_NFE_API_FAILED, e.getMessage()), e);
        }
    }

    private String post(long tenantId, String path, String jsonBody) {
        return exchangeWithRetry(tenantId, path, "POST", jsonBody);
    }

    private String put(long tenantId, String path, String jsonBody) {
        return exchangeWithRetry(tenantId, path, "PUT", jsonBody);
    }

    private String get(long tenantId, String path) {
        return exchangeWithRetry(tenantId, path, "GET", null);
    }

    private String exchangeWithRetry(long tenantId, String path, String method, String jsonBody) {
        int attempts = 0;
        while (true) {
            attempts++;
            try {
                return exchangeOnce(tenantId, path, method, jsonBody);
            } catch (IllegalStateException e) {
                if (attempts < 4 && isRateLimited(e)) {
                    sleepBackoff(attempts);
                    continue;
                }
                throw e;
            }
        }
    }

    private static boolean isRateLimited(IllegalStateException e) {
        String msg = e.getMessage();
        return msg != null && (msg.contains("HTTP 429") || msg.contains("429 em "));
    }

    private static void sleepBackoff(int attempt) {
        try {
            Thread.sleep(1500L * attempt);
        } catch (InterruptedException ie) {
            Thread.currentThread().interrupt();
            throw new IllegalStateException("Bling rate limit backoff interrupted", ie);
        }
    }

    private String exchangeOnce(long tenantId, String path, String method, String jsonBody) {
        Optional<String> token = tenantConnectionService.resolveAccessToken(tenantId);
        if (token.isEmpty()) {
            throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_TENANT_NO_TOKEN, "tenantId", String.valueOf(tenantId)));
        }
        try {
            String base = normalizeBase(platformConfig.getApiBaseUrl());
            HttpRequest.Builder builder = HttpRequest.newBuilder(URI.create(base + path))
                    .header("Authorization", "Bearer " + token.get())
                    .header("Accept", "application/json")
                    .header("enable-jwt", "1");
            if ("POST".equals(method) || "PUT".equals(method)) {
                builder.timeout(Duration.ofSeconds(30))
                        .header("Content-Type", "application/json")
                        .method(method, HttpRequest.BodyPublishers.ofString(jsonBody != null ? jsonBody : "{}"));
            } else {
                builder.timeout(Duration.ofSeconds(20)).GET();
            }
            HttpResponse<String> res = http.send(builder.build(), HttpResponse.BodyHandlers.ofString());
            if (res.statusCode() < 200 || res.statusCode() >= 300) {
                if ("POST".equals(method) || "PUT".equals(method)) {
                    throw new IllegalStateException(
                            "Bling HTTP " + res.statusCode() + " em " + method + " " + path + ": " + truncate(res.body(), 400));
                }
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.BLING_HTTP_ERROR, "detail", res.statusCode() + " em " + path));
            }
            return res.body() != null ? res.body() : "";
        } catch (IllegalStateException e) {
            throw e;
        } catch (Exception e) {
            if ("POST".equals(method) || "PUT".equals(method)) {
                throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_POST_FAILED, path + ": " + e.getMessage()), e);
            }
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.BLING_GET_FAILED, path + ": " + e.getMessage()), e);
        }
    }

    private static String firstText(JsonNode node, String... fields) {
        for (String f : fields) {
            JsonNode v = node.get(f);
            if (v != null && !v.isNull()) {
                String s = v.asText(null);
                if (s != null && !s.isBlank()) {
                    return s.trim();
                }
            }
        }
        return null;
    }

    private static String truncate(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "...";
    }

    private static String normalizeBase(String apiBaseUrl) {
        return apiBaseUrl.endsWith("/") ? apiBaseUrl.substring(0, apiBaseUrl.length() - 1) : apiBaseUrl;
    }
}
