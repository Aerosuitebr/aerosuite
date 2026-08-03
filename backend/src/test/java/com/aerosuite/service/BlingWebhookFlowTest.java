package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.integration.bling.BlingPedidosJsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.node.ObjectNode;
import org.junit.jupiter.api.Test;

/**
 * Verifica roteamento de eventos e encadeamento lógico pedido → NF-e sem API/DB.
 */
class BlingWebhookFlowTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    enum Route {
        CONTACT,
        PEDIDO,
        NFE,
        IGNORE
    }

    @Test
    void routesContactPedidoAndNfeExclusively() throws Exception {
        assertEquals(Route.CONTACT, route("contato.updated", json("{\"$resource\":\"/contatos/1\"}")));
        assertEquals(Route.PEDIDO, route("pedido.updated", json("{\"$resource\":\"/pedidos/vendas/9\"}")));
        assertEquals(Route.NFE, route("nfe.autorizada", json("{\"$resource\":\"/nfe/501\"}")));
        assertEquals(Route.IGNORE, route("estoque.movimentado", json("{\"$resource\":\"/estoques\"}")));
    }

    @Test
    void pedidoBeforeNfe_contactDoesNotStealPedido() throws Exception {
        JsonNode pedidoPayload = json("{\"$resource\":\"/pedidos/vendas\",\"data\":{\"id\":100}}");
        assertFalse(BlingContactSyncService.isContactEvent("pedido.updated", pedidoPayload));
        assertTrue(PropostaBlingPedidoService.isPedidoEvent("pedido.updated", pedidoPayload));
        assertFalse(BlingFiscalSyncService.isNfeEvent("pedido.updated", pedidoPayload));
    }

    @Test
    void fullChain_numeroLojaLinksPedidoToNfeViaPedidoId() throws Exception {
        String numeroProposta = "PROP-20260603-0042";
        String pedidoJson =
                """
                {"data":{"id":9001,"numero":"PV-1","situacao":"Atendido","numeroLoja":"%s",
                 "pedidoVenda":{"id":9001}}}
                """
                        .formatted(numeroProposta);
        var pedido = BlingPedidosJsonParser.parsePedido(pedidoJson);
        assertEquals(numeroProposta, pedido.numeroLoja);

        String nfeJson =
                """
                {"data":{"id":501,"numero":"123","situacao":"Autorizada",
                 "chaveAcesso":"35260601234567890123456789012345678901234",
                 "pedidoVenda":{"id":9001}}}
                """;
        var nfe = BlingPedidosJsonParser.parseNfe(nfeJson);
        assertEquals(9001L, nfe.pedidoId);
        assertEquals(501L, nfe.id);

        JsonNode webhookJob = buildWebhookJobPayload("nfe.autorizada", "501", MAPPER.readTree(nfeJson));
        assertEquals(Route.NFE, route("nfe.autorizada", webhookJob.get("payload")));
        assertEquals(501L, BlingFiscalSyncService.extractNfeId(webhookJob.get("payload")));
    }

    @Test
    void jobPayloadStructure_matchesProcessorExpectations() throws Exception {
        String rawWebhook =
                """
                {
                  "eventId": "evt-1",
                  "event": "pedido.updated",
                  "data": { "id": 9001, "numeroLoja": "PROP-1" }
                }
                """;
        JsonNode root = MAPPER.readTree(rawWebhook);
        ObjectNode jobPayload = MAPPER.createObjectNode();
        jobPayload.put("eventType", root.path("event").asText());
        jobPayload.put("resourceId", root.path("data").path("id").asText());
        jobPayload.set("payload", root);

        JsonNode eventPayload = jobPayload.get("payload");
        assertTrue(PropostaBlingPedidoService.isPedidoEvent(jobPayload.path("eventType").asText(), eventPayload));
        assertEquals(9001L, PropostaBlingPedidoService.extractPedidoId(eventPayload));
        long fromResource = jobPayload.path("resourceId").asLong(0);
        assertEquals(9001L, fromResource);
    }

    private static Route route(String eventType, JsonNode payload) {
        if (BlingContactSyncService.isContactEvent(eventType, payload)) {
            return Route.CONTACT;
        }
        if (PropostaBlingPedidoService.isPedidoEvent(eventType, payload)) {
            return Route.PEDIDO;
        }
        if (BlingFiscalSyncService.isNfeEvent(eventType, payload)) {
            return Route.NFE;
        }
        return Route.IGNORE;
    }

    private static ObjectNode buildWebhookJobPayload(String eventType, String resourceId, JsonNode payload)
            throws Exception {
        ObjectNode job = MAPPER.createObjectNode();
        job.put("eventType", eventType);
        job.put("resourceId", resourceId);
        job.set("payload", payload);
        return job;
    }

    private static JsonNode json(String raw) throws Exception {
        return MAPPER.readTree(raw);
    }
}
