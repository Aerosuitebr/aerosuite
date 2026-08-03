package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.billing.BillingGateway;
import com.aerosuite.billing.BillingGatewaySelector;
import com.aerosuite.domain.TenantBilling;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.BillingCheckoutResponseDto;
import com.aerosuite.dto.BillingStatusDto;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import java.time.LocalDateTime;
import org.eclipse.microprofile.config.inject.ConfigProperty;

@ApplicationScoped
public class TenantBillingService {

    @Inject
    BillingGatewaySelector billingGatewaySelector;

    @ConfigProperty(name = "aero.suite.billing.trial-days", defaultValue = "7")
    int trialDays;

    @ConfigProperty(name = "aero.suite.billing.provider", defaultValue = "mock")
    String billingProvider;

    @Transactional
    public void initBillingForNewTenant(long tenantId, boolean platformTenant) {
        if (TenantBilling.findByTenantId(tenantId) != null) {
            return;
        }
        TenantBilling b = new TenantBilling();
        b.tenantId = tenantId;
        b.provedor = platformTenant ? "internal" : billingProvider;
        if (platformTenant) {
            b.planoCodigo = "platform";
            b.status = "active";
            b.trialEndsAt = null;
        } else {
            b.planoCodigo = "trial";
            b.status = "trialing";
            b.trialEndsAt = LocalDateTime.now().plusDays(trialDays);
        }
        b.updatedAt = LocalDateTime.now();
        b.persist();
    }

    public BillingStatusDto getStatus(long tenantId) {
        TenantBilling b = TenantBilling.findByTenantId(tenantId);
        if (b == null) {
            initBillingForNewTenant(tenantId, tenantId == TenantConstants.DEFAULT_TENANT_ID);
            b = TenantBilling.findByTenantId(tenantId);
        }
        BillingStatusDto dto = new BillingStatusDto();
        dto.tenantId = tenantId;
        dto.planoCodigo = b.planoCodigo;
        dto.status = resolveEffectiveStatus(b);
        dto.trialEndsAt = b.trialEndsAt;
        dto.provedor = b.provedor;
        dto.checkoutAvailable = !"platform".equals(b.planoCodigo);
        dto.stripeConfigured = billingGatewaySelector.resolve().isConfigured();
        return dto;
    }

    private static String resolveEffectiveStatus(TenantBilling b) {
        if ("trialing".equals(b.status) && b.trialEndsAt != null && LocalDateTime.now().isAfter(b.trialEndsAt)) {
            return "trial_expired";
        }
        return b.status;
    }

    @Transactional
    public BillingCheckoutResponseDto createCheckoutSession(long tenantId, String customerEmail) {
        TenantBilling b = TenantBilling.findByTenantId(tenantId);
        if (b == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_NOT_CONFIGURED));
        }
        if ("platform".equals(b.planoCodigo)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_PLATFORM_NO_CHECKOUT));
        }
        BillingGateway gateway = billingGatewaySelector.resolve();
        BillingCheckoutResponseDto out = gateway.createCheckoutSession(tenantId, customerEmail);
        b.status = "checkout_pending";
        b.provedor = gateway.providerId();
        b.updatedAt = LocalDateTime.now();
        b.persist();
        return out;
    }

    @Transactional
    public void activateMockSubscription(long tenantId) {
        if (!"mock".equalsIgnoreCase(billingProvider)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_MOCK_ONLY));
        }
        TenantBilling b = TenantBilling.findByTenantId(tenantId);
        if (b == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_NOT_FOUND));
        }
        b.planoCodigo = "professional";
        b.status = "active";
        b.trialEndsAt = null;
        b.externalSubscriptionId = "mock_sub_" + tenantId;
        b.updatedAt = LocalDateTime.now();
        b.persist();
    }

    public void handleBillingWebhook(String payload, String signature) {
        billingGatewaySelector.resolve().handleWebhook(payload, signature);
    }

    public boolean blocksAccess(long tenantId) {
        if (tenantId == TenantConstants.DEFAULT_TENANT_ID) {
            return false;
        }
        String status = getStatus(tenantId).status;
        return "trial_expired".equals(status) || "canceled".equals(status);
    }
}
