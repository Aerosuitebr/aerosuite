package com.aerosuite.integration.bling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;

/** Leitura/gravação de NCM e unidade no cadastro de produtos Bling. */
public final class BlingProductFiscalHelper {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private BlingProductFiscalHelper() {}

    public static JsonNode parseProductData(String body) {
        if (body == null || body.isBlank()) {
            return null;
        }
        try {
            JsonNode root = MAPPER.readTree(body);
            JsonNode data = root.get("data");
            return data != null && data.isObject() ? data : null;
        } catch (Exception ignored) {
            return null;
        }
    }

    public static String readNcm(JsonNode product) {
        if (product == null || !product.isObject()) {
            return null;
        }
        JsonNode tributacao = product.get("tributacao");
        if (tributacao != null && tributacao.isObject()) {
            String ncm = text(tributacao, "ncm");
            if (isValidNcm(normalizeNcm(ncm))) {
                return normalizeNcm(ncm);
            }
            JsonNode tribClassificacao = tributacao.get("classificacaoFiscal");
            if (tribClassificacao != null && tribClassificacao.isObject()) {
                ncm = text(tribClassificacao, "ncm");
                if (isValidNcm(normalizeNcm(ncm))) {
                    return normalizeNcm(ncm);
                }
            }
        }
        String ncm = text(product, "ncm");
        if (isValidNcm(normalizeNcm(ncm))) {
            return normalizeNcm(ncm);
        }
        JsonNode classificacao = product.get("classificacaoFiscal");
        if (classificacao != null && classificacao.isObject()) {
            ncm = text(classificacao, "ncm");
            if (isValidNcm(normalizeNcm(ncm))) {
                return normalizeNcm(ncm);
            }
        }
        return null;
    }

    public static String readUnidade(JsonNode product) {
        if (product == null || !product.isObject()) {
            return null;
        }
        String unidade = text(product, "unidade");
        return unidade != null && !unidade.isBlank() ? unidade : null;
    }

    public static boolean hasValidFiscal(JsonNode product) {
        return isValidNcm(readNcm(product)) && readUnidade(product) != null;
    }

    public static ObjectNode preparePutPayload(JsonNode existing, String ncm, String unidade) {
        ObjectNode payload;
        if (existing != null && existing.isObject()) {
            payload = (ObjectNode) existing.deepCopy();
            payload.remove("id");
            payload.remove("dataCriacao");
            payload.remove("dataAlteracao");
            payload.remove("imagemURL");
            payload.remove("midia");
            payload.remove("variacoes");
            payload.remove("estrutura");
            payload.remove("estoque");
        } else {
            payload = MAPPER.createObjectNode();
        }
        if (!payload.has("nome") || payload.get("nome").asText("").isBlank()) {
            payload.put("nome", "Item");
        }
        if (!payload.has("tipo")) {
            payload.put("tipo", "P");
        }
        if (!payload.has("situacao")) {
            payload.put("situacao", "A");
        }
        if (!payload.has("formato")) {
            payload.put("formato", "S");
        }
        applyFiscalFields(payload, ncm, unidade);
        return payload;
    }

    public static void applyFiscalFields(ObjectNode payload, String ncm, String unidade) {
        if (payload == null) {
            return;
        }
        if (unidade != null && !unidade.isBlank()) {
            payload.put("unidade", unidade.trim());
        }
        if (ncm != null && !ncm.isBlank()) {
            String trimmed = normalizeNcm(ncm.trim());
            if (trimmed == null) {
                return;
            }
            payload.put("ncm", trimmed);
            ObjectNode classificacao = payload.has("classificacaoFiscal")
                            && payload.get("classificacaoFiscal").isObject()
                    ? (ObjectNode) payload.get("classificacaoFiscal")
                    : payload.putObject("classificacaoFiscal");
            classificacao.put("ncm", trimmed);
            ObjectNode tributacao = payload.has("tributacao") && payload.get("tributacao").isObject()
                    ? (ObjectNode) payload.get("tributacao")
                    : payload.putObject("tributacao");
            tributacao.put("ncm", trimmed);
            if (!tributacao.has("origem")) {
                tributacao.put("origem", 0);
            }
            ObjectNode tribClassificacao = tributacao.has("classificacaoFiscal")
                            && tributacao.get("classificacaoFiscal").isObject()
                    ? (ObjectNode) tributacao.get("classificacaoFiscal")
                    : tributacao.putObject("classificacaoFiscal");
            tribClassificacao.put("ncm", trimmed);
        }
    }

    private static boolean isValidNcm(String ncm) {
        return ncm != null && ncm.length() == 8;
    }

    private static String normalizeNcm(String ncm) {
        if (ncm == null) {
            return null;
        }
        String digits = ncm.replaceAll("\\D", "");
        return digits.length() == 8 ? digits : null;
    }

    private static String text(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        String value = node.get(field).asText("").trim();
        return value.isEmpty() ? null : value;
    }
}
