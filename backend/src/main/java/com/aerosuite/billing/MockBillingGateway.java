package com.aerosuite.billing;

import com.aerosuite.dto.BillingCheckoutResponseDto;
import com.aerosuite.util.ServerUrlUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.UUID;

import com.aerosuite.i18n.ApiI18nMessages;

@ApplicationScoped
public class MockBillingGateway implements BillingGateway {

    @Inject
    ServerUrlUtil serverUrlUtil;

    @Override
    public String providerId() {
        return "mock";
    }

    @Override
    public boolean isConfigured() {
        return true;
    }

    @Override
    public BillingCheckoutResponseDto createCheckoutSession(long tenantId, String customerEmail) {
        String sessionId = UUID.randomUUID().toString();
        BillingCheckoutResponseDto out = new BillingCheckoutResponseDto();
        out.sessionId = sessionId;
        out.checkoutUrl = serverUrlUtil.getFrontendUrl() + "/billing/checkout?session=" + sessionId + "&tenant="
                + tenantId;
        out.provedor = "mock";
        out.message = ApiI18nMessages.encode(ApiI18nMessages.BILLING_MOCK_SESSION);
        return out;
    }

    @Override
    public void handleWebhook(String payload, String stripeSignatureHeader) {
        // noop
    }
}
