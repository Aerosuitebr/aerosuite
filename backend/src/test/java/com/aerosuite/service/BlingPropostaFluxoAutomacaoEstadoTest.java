package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.domain.BlingPropostaFluxoEvento;
import com.aerosuite.domain.PropostaBlingPedido;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.aerosuite.integration.bling.BlingPropostaFluxoViewDto;
import java.util.Collections;
import java.util.List;
import org.junit.jupiter.api.Test;

class BlingPropostaFluxoAutomacaoEstadoTest {

    @Test
    void aguardandoOsConclusao_whenOsGeradaNotConcludedAndAutoNfe() {
        TenantBlingFiscalConfig fiscal = fiscal(true, false);
        fiscal.autoEmitirNfe = true;
        PropostaComercial proposta = proposta(10L);
        PropostaBlingPedido pedido = new PropostaBlingPedido();
        BlingPropostaFluxoViewDto view = view(true, false, false);

        var estado = BlingPropostaFluxoService.resolveAutomacaoEstado(
                fiscal, proposta, pedido, Collections.emptyList(), view);

        assertEquals("AGUARDANDO_OS_CONCLUSAO", estado.motivo());
        assertTrue(estado.aguardandoConclusaoOs());
        assertFalse(estado.retryDisponivel());
    }

    @Test
    void aguardandoNfe_whenOsConcludedWithoutNfe() {
        TenantBlingFiscalConfig fiscal = fiscal(true, true);
        PropostaComercial proposta = proposta(11L);
        PropostaBlingPedido pedido = new PropostaBlingPedido();
        BlingPropostaFluxoViewDto view = view(true, true, false);

        var estado = BlingPropostaFluxoService.resolveAutomacaoEstado(
                fiscal, proposta, pedido, Collections.emptyList(), view);

        assertEquals("AGUARDANDO_NFE", estado.motivo());
        assertTrue(estado.retryDisponivel());
    }

    @Test
    void erroNfe_whenLastNfeEventFailed() {
        TenantBlingFiscalConfig fiscal = fiscal(true, true);
        PropostaComercial proposta = proposta(12L);
        PropostaBlingPedido pedido = new PropostaBlingPedido();
        BlingPropostaFluxoViewDto view = view(true, true, false);
        BlingPropostaFluxoEvento ev = new BlingPropostaFluxoEvento();
        ev.etapa = BlingPropostaFluxoService.ETAPA_NFE_FALHA;
        ev.status = BlingPropostaFluxoService.STATUS_FAILED;

        var estado = BlingPropostaFluxoService.resolveAutomacaoEstado(
                fiscal, proposta, pedido, List.of(ev), view);

        assertEquals("ERRO_NFE", estado.motivo());
        assertTrue(estado.comErro());
        assertTrue(estado.retryDisponivel());
    }

    private static TenantBlingFiscalConfig fiscal(boolean autoOs, boolean autoNfe) {
        TenantBlingFiscalConfig fiscal = new TenantBlingFiscalConfig();
        fiscal.autoOsOnPedido = autoOs;
        fiscal.autoEmitirNfe = autoNfe;
        return fiscal;
    }

    private static PropostaComercial proposta(long id) {
        PropostaComercial p = new PropostaComercial();
        p.id = id;
        return p;
    }

    private static BlingPropostaFluxoViewDto view(boolean osGerada, boolean osConcluida, boolean nfeEmitida) {
        BlingPropostaFluxoViewDto view = new BlingPropostaFluxoViewDto();
        view.osGerada = osGerada;
        view.osConcluida = osConcluida;
        view.nfeEmitida = nfeEmitida;
        return view;
    }
}
