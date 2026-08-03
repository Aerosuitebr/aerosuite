package com.aerosuite.service;

import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.PropostaBlingPedido;
import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.integration.bling.BlingNfeEmitResultDto;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

/**
 * Verifica que {@code onOsConcluded} aciona {@code emitirNfeForProposta} quando elegível (mock CDI).
 */
@QuarkusTest
class BlingPropostaFluxoOnOsConcludedEmitIT {

    private static final long TENANT_ID = TenantConstants.DEFAULT_TENANT_ID;

    @Inject
    BlingPropostaFluxoService fluxoService;

    @InjectMock
    BlingFiscalSyncService fiscalSyncService;

    @InjectMock
    TenantBlingFiscalConfigService fiscalConfigService;

    @Test
    @Transactional
    void onOsConcluded_invokesEmitirNfeForProposta() {
        OS os = new OS();
        os.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        os.idOs = 9001;
        os.dataConclusaoServ = LocalDate.now();
        os.persist();

        PropostaComercial proposta = new PropostaComercial();
        proposta.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        proposta.numeroProposta = "PROP-TEST-NFE";
        proposta.osId = os.id;
        proposta.persist();

        PropostaBlingPedido pedido = new PropostaBlingPedido();
        pedido.tenantId = TENANT_ID;
        pedido.propostaComercialId = proposta.id;
        pedido.blingPedidoId = 42L;
        pedido.persist();

        TenantBlingFiscalConfig fiscal = new TenantBlingFiscalConfig();
        fiscal.tenantId = TENANT_ID;
        fiscal.autoEmitirNfe = true;
        when(fiscalConfigService.resolveEffective(TENANT_ID)).thenReturn(fiscal);

        BlingNfeEmitResultDto emit = new BlingNfeEmitResultDto();
        emit.created = true;
        emit.blingNfeId = 100L;
        emit.numero = "123";
        when(fiscalSyncService.emitirNfeForProposta(eq(TENANT_ID), eq(proposta.id))).thenReturn(emit);

        fluxoService.onOsConcluded(TENANT_ID, os.id);

        verify(fiscalSyncService).emitirNfeForProposta(TENANT_ID, proposta.id);
    }
}
