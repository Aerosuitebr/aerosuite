package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TicketSlaPolicyTest {

    @Test
    void producaoCritica_reduzSlaAbaixoDeUmaHoraNaPrimeiraResposta() {
        TicketSlaPolicy.SlaTargets sla = TicketSlaPolicy.calcular("CRITICA", "PRODUCAO", null);
        assertEquals(30, sla.primeiraRespostaMinutos());
        assertEquals(120, sla.resolucaoMinutos());
        assertEquals(TicketSlaPolicy.MODIFIER_ACCELERATED, sla.ambienteModifier());
    }

    @Test
    void homologacaoMedia_mantemBaseline() {
        TicketSlaPolicy.SlaTargets sla = TicketSlaPolicy.calcular("MEDIA", "HOMOLOGACAO", null);
        assertEquals(480, sla.primeiraRespostaMinutos());
        assertEquals(2880, sla.resolucaoMinutos());
        assertEquals(TicketSlaPolicy.MODIFIER_STANDARD, sla.ambienteModifier());
    }

    @Test
    void desenvolvimentoAlta_ampliaPrazos() {
        TicketSlaPolicy.SlaTargets sla = TicketSlaPolicy.calcular("ALTA", "DESENVOLVIMENTO", null);
        assertEquals(360, sla.primeiraRespostaMinutos());
        assertEquals(2160, sla.resolucaoMinutos());
        assertEquals(TicketSlaPolicy.MODIFIER_RELAXED, sla.ambienteModifier());
    }

    @Test
    void producaoCategoriaOperacional_aplicaAjusteAdicionalResolucao() {
        TicketSlaPolicy.SlaTargets base = TicketSlaPolicy.calcular("ALTA", "PRODUCAO", null);
        TicketSlaPolicy.SlaTargets ops = TicketSlaPolicy.calcular("ALTA", "PRODUCAO", "OS");
        assertTrue(ops.resolucaoMinutos() <= base.resolucaoMinutos());
    }
}
