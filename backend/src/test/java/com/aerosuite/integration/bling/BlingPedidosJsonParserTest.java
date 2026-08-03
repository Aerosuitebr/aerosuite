package com.aerosuite.integration.bling;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import org.junit.jupiter.api.Test;

class BlingPedidosJsonParserTest {

    @Test
    void parsePedido_extractsIdNumeroSituacaoAndNumeroLoja() throws Exception {
        String json =
                """
                {
                  "data": {
                    "id": 9001,
                    "numero": "PV-42",
                    "situacao": "Em aberto",
                    "numeroLoja": "PROP-20260603-0007",
                    "contato": { "id": 55 }
                  }
                }
                """;
        BlingPedidoDetailDto dto = BlingPedidosJsonParser.parsePedido(json);
        assertEquals(9001L, dto.id);
        assertEquals("PV-42", dto.numero);
        assertEquals("Em aberto", dto.situacao);
        assertEquals("PROP-20260603-0007", dto.numeroLoja);
        assertEquals(55L, dto.contatoId);
    }

    @Test
    void parsePedido_emptyOrMissingIdReturnsNull() throws Exception {
        assertNull(BlingPedidosJsonParser.parsePedido(""));
        assertNull(BlingPedidosJsonParser.parsePedido("{}"));
        assertNull(BlingPedidosJsonParser.parsePedido("{\"data\":{\"numero\":\"x\"}}"));
    }

    @Test
    void parseCreatedPedidoId_fromPostResponse() throws Exception {
        String json = "{\"data\":{\"id\":777,\"numero\":\"1\"}}";
        assertEquals(777L, BlingPedidosJsonParser.parseCreatedPedidoId(json));
    }

    @Test
    void parseNfe_extractsPedidoVendaLink() throws Exception {
        String json =
                """
                {
                  "data": {
                    "id": 501,
                    "numero": "12345",
                    "chaveAcesso": "35260601234567890123456789012345678901234",
                    "situacao": "Autorizada",
                    "linkDanfe": "https://bling.example/danfe/501",
                    "pedidoVenda": { "id": 9001 }
                  }
                }
                """;
        BlingNfeDetailDto dto = BlingPedidosJsonParser.parseNfe(json);
        assertEquals(501L, dto.id);
        assertEquals("12345", dto.numero);
        assertEquals("35260601234567890123456789012345678901234", dto.chaveAcesso);
        assertEquals("Autorizada", dto.situacao);
        assertEquals("https://bling.example/danfe/501", dto.danfeUrl);
        assertEquals(9001L, dto.pedidoId);
    }

    @Test
    void parseNfe_fallbackIdPedidoVendaField() throws Exception {
        String json =
                """
                {"data":{"id":88,"numero":"9","idPedidoVenda":9001}}
                """;
        BlingNfeDetailDto dto = BlingPedidosJsonParser.parseNfe(json);
        assertEquals(88L, dto.id);
        assertEquals(9001L, dto.pedidoId);
    }

}
