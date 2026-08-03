package com.aerosuite.integration.bling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.List;

/** Parse da resposta JSON {@code GET /contatos} da API Bling v3. */
final class BlingContactsJsonParser {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private BlingContactsJsonParser() {}

    static List<BlingContactDto> parse(String body) throws Exception {
        List<BlingContactDto> out = new ArrayList<>();
        if (body == null || body.isBlank()) {
            return out;
        }
        JsonNode root = MAPPER.readTree(body);
        JsonNode data = root.get("data");
        if (data == null) {
            return out;
        }
        if (data.isArray()) {
            for (JsonNode node : data) {
                BlingContactDto c = fromNode(node);
                if (c != null) {
                    out.add(c);
                }
            }
            return out;
        }
        if (data.isObject()) {
            BlingContactDto c = fromNode(data);
            if (c != null) {
                out.add(c);
            }
        }
        return out;
    }

    static BlingContactDto parseOne(String body) throws Exception {
        List<BlingContactDto> list = parse(body);
        return list.isEmpty() ? null : list.get(0);
    }

    static Long parseCreatedId(String body) throws Exception {
        if (body == null || body.isBlank()) {
            return null;
        }
        JsonNode root = MAPPER.readTree(body);
        JsonNode data = root.get("data");
        if (data != null && data.has("id")) {
            long id = data.path("id").asLong(0);
            return id > 0 ? id : null;
        }
        if (root.has("id")) {
            long id = root.path("id").asLong(0);
            return id > 0 ? id : null;
        }
        return null;
    }

    private static BlingContactDto fromNode(JsonNode node) {
        if (node == null || !node.isObject()) {
            return null;
        }
        BlingContactDto c = new BlingContactDto();
        c.id = node.path("id").asLong(0);
        if (c.id == 0) {
            return null;
        }
        c.nome = text(node, "nome");
        c.email = text(node, "email");
        c.telefone = firstNonBlank(text(node, "telefone"), text(node, "celular"));
        c.cnpjCpf = firstNonBlank(text(node, "numeroDocumento"), text(node, "cnpj"), text(node, "cpf"));
        JsonNode endereco = node.get("endereco");
        if (endereco != null && endereco.isObject()) {
            c.endereco = text(endereco, "endereco");
            c.cidade = text(endereco, "municipio");
            c.uf = text(endereco, "uf");
        } else {
            c.endereco = text(node, "endereco");
            c.cidade = text(node, "cidade");
            c.uf = text(node, "uf");
        }
        return c;
    }

    private static String text(JsonNode node, String field) {
        JsonNode v = node.get(field);
        if (v == null || v.isNull()) {
            return null;
        }
        String s = v.asText(null);
        return s != null && !s.isBlank() ? s.trim() : null;
    }

    private static String firstNonBlank(String... values) {
        if (values == null) {
            return null;
        }
        for (String v : values) {
            if (v != null && !v.isBlank()) {
                return v;
            }
        }
        return null;
    }
}
