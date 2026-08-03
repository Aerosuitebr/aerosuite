package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.PropostaComercialItem;
import com.aerosuite.integration.bling.BlingPedidoDetailDto;
import com.aerosuite.integration.bling.BlingPedidosJsonParser;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.List;
import org.junit.jupiter.api.Test;

class PropostaBlingPedidoServiceTest {

    private static final ObjectMapper MAPPER = new ObjectMapper();

    @Test
    void buildPedidoJson_mapsItensContatoAndNumeroLoja() throws Exception {
        PropostaComercial proposta = new PropostaComercial();
        proposta.numeroProposta = "PROP-20260603-0001";
        proposta.produtoNome = "Overhaul motor";

        PropostaComercialItem i1 = new PropostaComercialItem();
        i1.produtoPn = "PN-A";
        i1.produtoNome = "Kit selo";
        i1.quantidade = 2;
        i1.valorUnitario = new BigDecimal("150.50");

        PropostaComercialItem i2 = new PropostaComercialItem();
        i2.produtoNome = "Mão de obra";
        i2.quantidade = 1;
        i2.valorUnitario = new BigDecimal("3200.00");

        String json = PropostaBlingPedidoService.buildPedidoJson(proposta, 42L, List.of(i1, i2));
        JsonNode root = MAPPER.readTree(json);

        assertEquals(42L, root.path("contato").path("id").asLong());
        assertEquals("PROP-20260603-0001", root.path("numeroLoja").asText());
        assertTrue(root.path("observacoes").asText().contains("PROP-20260603-0001"));

        JsonNode itens = root.path("itens");
        assertEquals(2, itens.size());
        assertEquals("PN-A", itens.get(0).path("codigo").asText());
        assertEquals("Kit selo", itens.get(0).path("descricao").asText());
        assertEquals(2, itens.get(0).path("quantidade").asInt());
        assertEquals(150.50, itens.get(0).path("valor").asDouble(), 0.001);
        assertEquals("Mão de obra", itens.get(1).path("descricao").asText());
    }

    @Test
    void buildPedidoJson_withoutItens_usesProdutoNomeAndValorFinal() throws Exception {
        PropostaComercial proposta = new PropostaComercial();
        proposta.numeroProposta = "PROP-X";
        proposta.produtoNome = "Serviço único";
        proposta.valorTotalFinal = new BigDecimal("999.99");

        String json = PropostaBlingPedidoService.buildPedidoJson(proposta, 10L, List.of());
        JsonNode root = MAPPER.readTree(json);
        JsonNode item = root.path("itens").get(0);

        assertEquals("Serviço único", item.path("descricao").asText());
        assertEquals(1, item.path("quantidade").asInt());
        assertEquals(999.99, item.path("valor").asDouble(), 0.001);
    }

    @Test
    void extractPedidoId_fromWebhookPayload() throws Exception {
        JsonNode root = MAPPER.readTree("{\"data\":{\"id\":12345,\"numero\":\"1\"}}");
        assertEquals(12345L, PropostaBlingPedidoService.extractPedidoId(root));
    }

    @Test
    void extractPedidoId_fallbackResourceId() throws Exception {
        JsonNode root = MAPPER.readTree("{\"resourceId\":\"9876\"}");
        assertEquals(9876L, PropostaBlingPedidoService.extractPedidoId(root));
    }

    @Test
    void isPedidoEvent_detectsPedidoAndVenda() throws Exception {
        JsonNode root = MAPPER.readTree("{\"$resource\":\"/pedidos/vendas\"}");
        assertTrue(PropostaBlingPedidoService.isPedidoEvent("order.updated", root));
        assertTrue(PropostaBlingPedidoService.isPedidoEvent("pedido.criado", root));
        JsonNode contato = MAPPER.readTree("{\"$resource\":\"/contatos/1\"}");
        assertFalse(PropostaBlingPedidoService.isPedidoEvent("contato.updated", contato));
    }

    @Test
    void numeroLojaRoundTrip_linksPedidoResponseToPropostaNumero() throws Exception {
        PropostaComercial proposta = new PropostaComercial();
        proposta.numeroProposta = "PROP-20260603-0099";
        proposta.produtoNome = "Teste";
        proposta.valorTotalFinal = new BigDecimal("100");

        String outbound = PropostaBlingPedidoService.buildPedidoJson(proposta, 1L, List.of());
        String numeroLoja = MAPPER.readTree(outbound).path("numeroLoja").asText();

        String webhookPedidoResponse =
                """
                {"data":{"id":555,"numero":"10","situacao":"Atendido","numeroLoja":"%s"}}
                """
                        .formatted(numeroLoja);
        BlingPedidoDetailDto detail = BlingPedidosJsonParser.parsePedido(webhookPedidoResponse);
        assertEquals("PROP-20260603-0099", detail.numeroLoja);
        assertEquals(555L, detail.id);
    }

    @Test
    void buildPedidoJson_appliesFiscalDefaultsOnItens() throws Exception {
        PropostaComercial proposta = new PropostaComercial();
        proposta.numeroProposta = "PROP-FISCAL";
        proposta.produtoNome = "Serviço";

        PropostaComercialItem item = new PropostaComercialItem();
        item.produtoNome = "Peça";
        item.quantidade = 1;
        item.valorUnitario = new BigDecimal("10");

        com.aerosuite.domain.TenantBlingFiscalConfig fiscal = new com.aerosuite.domain.TenantBlingFiscalConfig();
        fiscal.cfopPadrao = "5102";
        fiscal.ncmPadrao = "88073000";
        fiscal.naturezaOperacao = "Venda";

        String json = PropostaBlingPedidoService.buildPedidoJson(proposta, 99L, List.of(item), fiscal);
        JsonNode root = MAPPER.readTree(json);
        JsonNode row = root.path("itens").get(0);
        assertEquals("5102", row.path("cfop").asText());
        assertEquals("88073000", row.path("ncm").asText());
    }

    @Test
    void buildPedidoJson_appliesAliquotasOnItens() throws Exception {
        PropostaComercial proposta = new PropostaComercial();
        proposta.numeroProposta = "PROP-TAX";
        PropostaComercialItem item = new PropostaComercialItem();
        item.produtoNome = "Serviço";
        item.quantidade = 1;
        item.valorUnitario = new BigDecimal("100");

        com.aerosuite.domain.TenantBlingFiscalConfig fiscal = new com.aerosuite.domain.TenantBlingFiscalConfig();
        fiscal.aliquotaIcms = new BigDecimal("18.0000");
        fiscal.aliquotaPis = new BigDecimal("1.6500");
        fiscal.aliquotaCofins = new BigDecimal("7.6000");

        String json = PropostaBlingPedidoService.buildPedidoJson(proposta, 1L, List.of(item), fiscal);
        JsonNode row = MAPPER.readTree(json).path("itens").get(0);
        assertEquals(18.0, row.path("icms").path("aliquota").asDouble(), 0.001);
        assertEquals(1.65, row.path("pis").path("aliquota").asDouble(), 0.001);
        assertEquals(7.6, row.path("cofins").path("aliquota").asDouble(), 0.001);
    }
}
