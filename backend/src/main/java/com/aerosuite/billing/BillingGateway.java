package com.aerosuite.billing;

import com.aerosuite.dto.BillingCheckoutResponseDto;

/** Abstração do provedor de pagamento (mock ou Stripe). */
public interface BillingGateway {

    String providerId();

    boolean isConfigured();

    BillingCheckoutResponseDto createCheckoutSession(long tenantId, String customerEmail);

    void handleWebhook(String payload, String stripeSignatureHeader);
}
