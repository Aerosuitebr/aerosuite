package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;

class BlingFiscalSyncServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void extractNfeId_fromDataId() throws Exception {
        JsonNode root = MAPPER.readTree("{\"data\":{\"id\":501,\"numero\":\"1\"}}");
        assertEquals(501L, BlingFiscalSyncService.extractNfeId(root));
    }

    @Test
    void extractNfeId_fromNotaFiscalNested() throws Exception {
        JsonNode root = MAPPER.readTree("{\"data\":{\"notaFiscal\":{\"id\":777}}}");
        assertEquals(777L, BlingFiscalSyncService.extractNfeId(root));
    }

    @Test
    void extractNfeId_fallbackResourceId() throws Exception {
        JsonNode root = MAPPER.readTree("{\"resourceId\":888}");
        assertEquals(888L, BlingFiscalSyncService.extractNfeId(root));
    }

    @Test
    void isNfeEvent_detectsNfeAndNota() throws Exception {
        JsonNode nfe = MAPPER.readTree("{\"$resource\":\"/nfe/123\"}");
        JsonNode nota = MAPPER.readTree("{\"$resource\":\"/notas-fiscais\"}");
        assertTrue(BlingFiscalSyncService.isNfeEvent("nfe.autorizada", nfe));
        assertTrue(BlingFiscalSyncService.isNfeEvent("updated", nota));
        JsonNode pedido = MAPPER.readTree("{\"$resource\":\"/pedidos/vendas\"}");
        assertFalse(BlingFiscalSyncService.isNfeEvent("pedido.updated", pedido));
    }

    @Test
    void buildNfeJson_includesPedidoNaturezaAndSerie() throws Exception {
        com.aerosuite.domain.TenantBlingFiscalConfig fiscal = new com.aerosuite.domain.TenantBlingFiscalConfig();
        fiscal.naturezaOperacao = "Venda de mercadoria";
        fiscal.serieNfe = "1";
        fiscal.cfopPadrao = "5102";
        String json = BlingFiscalSyncService.buildNfeJson(9001L, fiscal);
        JsonNode root = MAPPER.readTree(json);
        assertEquals(9001L, root.path("pedidoVendaId").asLong());
        assertEquals(1, root.path("tipo").asInt());
        assertEquals("Venda de mercadoria", root.path("naturezaOperacao").asText());
        assertEquals("1", root.path("serie").asText());
        assertEquals("5102", root.path("cfop").asText());
    }
}
