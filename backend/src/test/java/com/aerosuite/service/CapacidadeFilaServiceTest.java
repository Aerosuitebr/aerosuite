package com.aerosuite.service;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class CapacidadeFilaServiceTest {

    @Test
    void normalizarEstagioPadraoQuandoVazio() {
        assertEquals("AGUARDANDO", CapacidadeFilaService.normalizarEstagio(null));
        assertEquals("AGUARDANDO", CapacidadeFilaService.normalizarEstagio("  "));
    }

    @Test
    void normalizarEstagioValido() {
        assertEquals("EM_EXECUCAO", CapacidadeFilaService.normalizarEstagio("em_execucao"));
    }

    @Test
    void normalizarPrioridadeAog() {
        assertEquals("AOG", CapacidadeFilaService.normalizarPrioridade("aog"));
        assertEquals("NORMAL", CapacidadeFilaService.normalizarPrioridade(null));
    }
}
