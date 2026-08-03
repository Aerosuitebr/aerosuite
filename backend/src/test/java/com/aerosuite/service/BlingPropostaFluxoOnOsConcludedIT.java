package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.domain.PropostaBlingPedido;
import com.aerosuite.domain.TenantBlingFiscalConfig;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.Test;

/**
 * Smoke CDI + regras do fluxo OS concluída → NF-e (sem BD de proposta real).
 */
@QuarkusTest
class BlingPropostaFluxoOnOsConcludedIT {

    @Inject
    BlingPropostaFluxoService fluxoService;

    @Test
    void cdiBeanAvailable() {
        assertNotNull(fluxoService);
    }

    @Test
    void retryNfeDecision_whenOsConcludedWithoutNfe() {
        TenantBlingFiscalConfig fiscal = new TenantBlingFiscalConfig();
        fiscal.autoEmitirNfe = true;
        PropostaBlingPedido pedido = new PropostaBlingPedido();
        assertTrue(BlingPropostaFluxoService.shouldRetryNfeAfterOsConcluded(fiscal, pedido, true, false));
    }
}
