package com.aerosuite.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;

import java.util.List;
import org.junit.jupiter.api.Test;

class BillingGatewaySelectorTest {

    private final MockBillingGateway mock = new MockBillingGateway();
    private final PagarmeBillingGateway pagarme = new PagarmeBillingGateway();

    @Test
    void findsMockProvider() {
        BillingGateway g = BillingGatewaySelector.findByProviderId("mock", List.of(mock, pagarme));
        assertEquals("mock", g.providerId());
    }

    @Test
    void findsPagarmeProvider() {
        BillingGateway g = BillingGatewaySelector.findByProviderId("pagarme", List.of(mock, pagarme));
        assertEquals("pagarme", g.providerId());
    }

    @Test
    void returnsNullForUnknownProvider() {
        assertNull(BillingGatewaySelector.findByProviderId("stripe", List.of(mock, pagarme)));
    }
}
