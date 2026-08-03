package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.domain.PropostaBlingPedido;
import com.aerosuite.domain.TenantBlingFiscalConfig;
import org.junit.jupiter.api.Test;

/**
 * Decisões do fluxo OS concluída → NF-e (sem CDI/BD — complementa testes estáticos existentes).
 */
class BlingPropostaFluxoOsNfeFlowTest {

    @Test
    void shouldAutoEmitNfeOnOsConcluded_whenFiscalFlagEnabled() {
        TenantBlingFiscalConfig fiscal = new TenantBlingFiscalConfig();
        fiscal.autoEmitirNfe = true;
        assertTrue(BlingPropostaFluxoService.shouldAutoEmitNfeOnOsConcluded(fiscal));
    }

    @Test
    void shouldAutoEmitNfeOnOsConcluded_falseWhenDisabledOrMissing() {
        assertFalse(BlingPropostaFluxoService.shouldAutoEmitNfeOnOsConcluded(null));
        TenantBlingFiscalConfig fiscal = new TenantBlingFiscalConfig();
        fiscal.autoEmitirNfe = false;
        assertFalse(BlingPropostaFluxoService.shouldAutoEmitNfeOnOsConcluded(fiscal));
    }

    @Test
    void shouldRetryNfeAfterOsConcluded_requiresPedidoOsConcludedAndNoActiveNfe() {
        TenantBlingFiscalConfig fiscal = new TenantBlingFiscalConfig();
        fiscal.autoEmitirNfe = true;
        PropostaBlingPedido pedido = new PropostaBlingPedido();

        assertTrue(BlingPropostaFluxoService.shouldRetryNfeAfterOsConcluded(fiscal, pedido, true, false));
        assertFalse(BlingPropostaFluxoService.shouldRetryNfeAfterOsConcluded(fiscal, null, true, false));
        assertFalse(BlingPropostaFluxoService.shouldRetryNfeAfterOsConcluded(fiscal, pedido, false, false));
        assertFalse(BlingPropostaFluxoService.shouldRetryNfeAfterOsConcluded(fiscal, pedido, true, true));
    }
}
