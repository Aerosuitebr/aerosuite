package com.aerosuite.billing;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.inject.Instance;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class BillingGatewaySelector {

    @Inject
    Instance<BillingGateway> gateways;

    @ConfigProperty(name = "aero.suite.billing.provider", defaultValue = "mock")
    String billingProvider;

    public BillingGateway resolve() {
        String wanted = billingProvider == null ? "mock" : billingProvider.trim().toLowerCase();
        BillingGateway match = findByProviderId(wanted, gateways);
        if (match != null) {
            return match;
        }
        return gateways.select(MockBillingGateway.class).get();
    }

    static BillingGateway findByProviderId(String wanted, Iterable<BillingGateway> gateways) {
        if (wanted == null || gateways == null) {
            return null;
        }
        for (BillingGateway g : gateways) {
            if (wanted.equals(g.providerId())) {
                return g;
            }
        }
        return null;
    }
}
