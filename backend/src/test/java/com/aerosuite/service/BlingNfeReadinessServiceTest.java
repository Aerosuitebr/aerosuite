package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyBoolean;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.integration.bling.BlingNfeReadinessDto;
import com.aerosuite.integration.bling.BlingScopeCheckDto;
import com.aerosuite.integration.bling.BlingScopeProbe;
import com.aerosuite.integration.bling.BlingScopesStatusDto;
import com.aerosuite.integration.bling.TenantBlingConnectionService;
import com.aerosuite.integration.bling.TenantBlingConnectionViewDto;
import io.quarkus.test.InjectMock;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

@QuarkusTest
class BlingNfeReadinessServiceTest {

    private static final long TENANT_ID = TenantConstants.DEFAULT_TENANT_ID;

    @Inject
    BlingNfeReadinessService readinessService;

    @InjectMock
    TenantBlingConnectionService tenantConnectionService;

    @InjectMock
    TenantBlingFiscalConfigService fiscalConfigService;

    @InjectMock
    BlingScopeProbe scopeProbe;

    @BeforeEach
    void resetMocks() {
        readinessService.invalidateTenant(TENANT_ID);
    }

    @Test
    void evaluateTenant_notReadyWhenOAuthNotOperational() {
        TenantBlingConnectionViewDto conn = connection(false, false);
        when(tenantConnectionService.getConnectionView(eq(TENANT_ID), anyBoolean())).thenReturn(conn);
        when(fiscalConfigService.resolveEffective(TENANT_ID)).thenReturn(fiscalComplete());

        BlingNfeReadinessDto out = readinessService.evaluateTenant(TENANT_ID, true);

        assertFalse(out.ready);
        assertTrue(out.blockers.stream().anyMatch(b -> b.contains("oauth") || b.length() > 0));
    }

    @Test
    void evaluateTenant_readyWhenConnectedFiscalCompleteAndScopesOk() {
        TenantBlingConnectionViewDto conn = connection(true, true);
        when(tenantConnectionService.getConnectionView(eq(TENANT_ID), anyBoolean())).thenReturn(conn);
        when(fiscalConfigService.resolveEffective(TENANT_ID)).thenReturn(fiscalComplete());
        BlingScopesStatusDto scopes = new BlingScopesStatusDto();
        BlingScopeCheckDto ok = new BlingScopeCheckDto();
        ok.resource = "produtos";
        ok.label = "Produtos";
        ok.ok = true;
        scopes.checks.add(ok);
        scopes.allOk = true;
        when(scopeProbe.probe(TENANT_ID)).thenReturn(scopes);

        BlingNfeReadinessDto out = readinessService.evaluateTenant(TENANT_ID, true);

        assertTrue(out.ready);
        assertTrue(out.blockers.isEmpty());
    }

    private static TenantBlingConnectionViewDto connection(boolean linked, boolean tokenOperational) {
        TenantBlingConnectionViewDto conn = new TenantBlingConnectionViewDto();
        conn.platformEnabled = true;
        conn.oauthConfigured = true;
        conn.linked = linked;
        conn.tokenOperational = tokenOperational;
        conn.connected = tokenOperational;
        return conn;
    }

    private static TenantBlingFiscalConfig fiscalComplete() {
        TenantBlingFiscalConfig fiscal = new TenantBlingFiscalConfig();
        fiscal.cfopPadrao = "5102";
        fiscal.ncmPadrao = "88032000";
        fiscal.certificadoPfxEnc = "dGVzdA==";
        return fiscal;
    }
}
