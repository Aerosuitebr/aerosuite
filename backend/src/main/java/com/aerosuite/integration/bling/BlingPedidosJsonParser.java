package com.aerosuite.integration.bling;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;

public final class BlingPedidosJsonParser {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    private BlingPedidosJsonParser() {}

    public static BlingPedidoDetailDto parsePedido(String body) throws Exception {
        if (body == null || body.isBlank()) {
            return null;
        }
        JsonNode root = MAPPER.readTree(body);
        JsonNode data = root.get("data");
        if (data == null || data.isNull()) {
            return null;
        }
        BlingPedidoDetailDto dto = new BlingPedidoDetailDto();
        dto.id = data.path("id").asLong(0);
        if (dto.id == 0) {
            return null;
        }
        dto.numero = text(data, "numero", "numeroPedido");
        dto.situacao = text(data, "situacao", "status");
        dto.numeroLoja = text(data, "numeroLoja", "numeroPedidoLoja");
        JsonNode contato = data.get("contato");
        if (contato != null && contato.has("id")) {
            dto.contatoId = contato.path("id").asLong(0);
        }
        return dto;
    }

    public static Long parseCreatedPedidoId(String body) throws Exception {
        BlingPedidoDetailDto dto = parsePedido(body);
        return dto != null ? dto.id : null;
    }

    public static Long parseCreatedNfeId(String body) throws Exception {
        BlingNfeDetailDto dto = parseNfe(body);
        return dto != null ? dto.id : null;
    }

    public static BlingNfeDetailDto parseNfe(String body) throws Exception {
        if (body == null || body.isBlank()) {
            return null;
        }
        JsonNode root = MAPPER.readTree(body);
        JsonNode data = root.get("data");
        if (data == null || data.isNull()) {
            return null;
        }
        BlingNfeDetailDto dto = new BlingNfeDetailDto();
        dto.id = data.path("id").asLong(0);
        if (dto.id == 0) {
            return null;
        }
        dto.numero = text(data, "numero", "numeroNota");
        dto.chaveAcesso = text(data, "chaveAcesso", "chave");
        dto.situacao = text(data, "situacao", "status");
        dto.danfeUrl = text(data, "linkDanfe", "urlDanfe", "danfe");
        JsonNode pedido = data.get("pedidoVenda");
        if (pedido == null) {
            pedido = data.get("pedido");
        }
        if (pedido != null && pedido.has("id")) {
            dto.pedidoId = pedido.path("id").asLong(0);
        } else {
            dto.pedidoId = data.path("idPedidoVenda").asLong(0);
            if (dto.pedidoId == 0) {
                dto.pedidoId = null;
            }
        }
        return dto;
    }

    private static String text(JsonNode node, String... fields) {
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
}
