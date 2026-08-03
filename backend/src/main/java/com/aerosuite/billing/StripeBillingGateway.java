package com.aerosuite.billing;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantBilling;
import com.aerosuite.dto.BillingCheckoutResponseDto;
import com.aerosuite.util.ServerUrlUtil;
import com.stripe.Stripe;
import com.stripe.exception.SignatureVerificationException;
import com.stripe.exception.StripeException;
import com.stripe.model.Event;
import com.stripe.model.Subscription;
import com.stripe.model.checkout.Session;
import com.stripe.net.Webhook;
import com.stripe.param.checkout.SessionCreateParams;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import java.time.LocalDateTime;
import java.util.Locale;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class StripeBillingGateway implements BillingGateway {

    private static final Logger LOG = Logger.getLogger(StripeBillingGateway.class);

    @Inject
    ServerUrlUtil serverUrlUtil;

    @ConfigProperty(name = "aero.suite.billing.stripe.secret-key")
    java.util.Optional<String> secretKey;

    @ConfigProperty(name = "aero.suite.billing.stripe.webhook-secret")
    java.util.Optional<String> webhookSecret;

    @ConfigProperty(name = "aero.suite.billing.stripe.price-id")
    java.util.Optional<String> priceId;

    @ConfigProperty(name = "aero.suite.billing.stripe.success-url")
    java.util.Optional<String> successUrl;

    @ConfigProperty(name = "aero.suite.billing.stripe.cancel-url")
    java.util.Optional<String> cancelUrl;

    @Override
    public String providerId() {
        return "stripe";
    }

    @Override
    public boolean isConfigured() {
        return secretKey.filter(s -> !s.isBlank()).isPresent()
                && priceId.filter(s -> !s.isBlank()).isPresent();
    }

    private void initStripe() {
        String key = secretKey.orElse("").trim();
        if (key.isEmpty()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_NOT_CONFIGURED));
        }
        Stripe.apiKey = key;
    }

    @Override
    public BillingCheckoutResponseDto createCheckoutSession(long tenantId, String customerEmail) {
        if (!isConfigured()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_INCOMPLETE));
        }
        initStripe();
        Tenant tenant = Tenant.findById(tenantId);
        String codigo = tenant != null ? tenant.codigo : String.valueOf(tenantId);
        String success = successUrl.filter(s -> !s.isBlank())
                .orElse(serverUrlUtil.getFrontendUrl() + "/billing?stripe=success");
        String cancel = cancelUrl.filter(s -> !s.isBlank())
                .orElse(serverUrlUtil.getFrontendUrl() + "/billing?stripe=cancel");

        try {
            SessionCreateParams.Builder builder = SessionCreateParams.builder()
                    .setMode(SessionCreateParams.Mode.SUBSCRIPTION)
                    .setSuccessUrl(success)
                    .setCancelUrl(cancel)
                    .addLineItem(SessionCreateParams.LineItem.builder()
                            .setPrice(priceId.get().trim())
                            .setQuantity(1L)
                            .build())
                    .putMetadata("tenant_id", String.valueOf(tenantId))
                    .putMetadata("tenant_codigo", codigo);

            if (customerEmail != null && !customerEmail.isBlank()) {
                builder.setCustomerEmail(customerEmail.trim().toLowerCase(Locale.ROOT));
            }

            Session session = Session.create(builder.build());

            BillingCheckoutResponseDto out = new BillingCheckoutResponseDto();
            out.sessionId = session.getId();
            out.checkoutUrl = session.getUrl();
            out.provedor = "stripe";
            out.message = ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_REDIRECT);
            return out;
        } catch (StripeException e) {
            LOG.errorf(e, "Stripe checkout failed tenant=%d", tenantId);
            throw new BadRequestException(ApiI18nMessages.withDetail(ApiI18nMessages.BILLING_STRIPE_SESSION_FAILED, e.getMessage()));
        }
    }

    @Override
    public void handleWebhook(String payload, String stripeSignatureHeader) {
        String whSecret = webhookSecret.orElse("").trim();
        if (whSecret.isEmpty()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_WEBHOOK_NOT_CONFIGURED));
        }
        try {
            Event event = Webhook.constructEvent(payload, stripeSignatureHeader, whSecret);
            processEvent(event);
        } catch (SignatureVerificationException e) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_STRIPE_SIGNATURE_INVALID));
        }
    }

    @Transactional
    void processEvent(Event event) {
        String type = event.getType();
        if ("checkout.session.completed".equals(type)) {
            Session session = (Session) event.getDataObjectDeserializer()
                    .getObject()
                    .filter(o -> o instanceof Session)
                    .orElse(null);
            if (session == null) {
                session = deserializeSession(event);
            }
            if (session != null) {
                applyCheckoutCompleted(session);
            }
            return;
        }
        if ("customer.subscription.updated".equals(type) || "customer.subscription.deleted".equals(type)) {
            Subscription subscription = (Subscription) event.getDataObjectDeserializer()
                    .getObject()
                    .filter(o -> o instanceof Subscription)
                    .orElse(null);
            if (subscription == null) {
                subscription = deserializeSubscription(event);
            }
            if (subscription != null) {
                applySubscriptionChange(subscription, "customer.subscription.deleted".equals(type));
            }
        }
    }

    private Session deserializeSession(Event event) {
        try {
            initStripe();
            return (Session) event.getDataObjectDeserializer().deserializeUnsafe();
        } catch (Exception e) {
            LOG.warnf("Could not deserialize checkout session: %s", e.getMessage());
            return null;
        }
    }

    private Subscription deserializeSubscription(Event event) {
        try {
            initStripe();
            return (Subscription) event.getDataObjectDeserializer().deserializeUnsafe();
        } catch (Exception e) {
            LOG.warnf("Could not deserialize subscription: %s", e.getMessage());
            return null;
        }
    }

    private void applySubscriptionChange(Subscription subscription, boolean deleted) {
        String subId = subscription.getId();
        TenantBilling b = TenantBilling.find("externalSubscriptionId", subId).firstResult();
        if (b == null && subscription.getCustomer() != null) {
            b = TenantBilling.find("externalCustomerId", subscription.getCustomer()).firstResult();
        }
        if (b == null) {
            LOG.warnf("Stripe subscription event without matching tenant billing: %s", subId);
            return;
        }
        b.provedor = "stripe";
        b.externalSubscriptionId = subId;
        if (subscription.getCustomer() != null) {
            b.externalCustomerId = subscription.getCustomer();
        }
        if (deleted || "canceled".equalsIgnoreCase(subscription.getStatus())) {
            b.status = "canceled";
        } else {
            b.status = mapStripeSubscriptionStatus(subscription.getStatus());
            if ("active".equals(b.status) || "trialing".equals(subscription.getStatus())) {
                b.planoCodigo = "professional";
                b.trialEndsAt = null;
            }
        }
        b.updatedAt = LocalDateTime.now();
        b.persist();
        LOG.infof("Stripe subscription %s for tenant %d -> status %s", subId, b.tenantId, b.status);
    }

    private static String mapStripeSubscriptionStatus(String stripeStatus) {
        if (stripeStatus == null || stripeStatus.isBlank()) {
            return "unknown";
        }
        return switch (stripeStatus.toLowerCase(Locale.ROOT)) {
            case "active", "trialing" -> "active";
            case "past_due", "unpaid" -> "past_due";
            case "canceled", "incomplete_expired" -> "canceled";
            default -> stripeStatus.toLowerCase(Locale.ROOT);
        };
    }

    private void applyCheckoutCompleted(Session session) {
        String tenantIdStr = session.getMetadata() != null ? session.getMetadata().get("tenant_id") : null;
        if (tenantIdStr == null) {
            LOG.warn("Stripe session without tenant_id metadata");
            return;
        }
        long tenantId = Long.parseLong(tenantIdStr);
        TenantBilling b = TenantBilling.findByTenantId(tenantId);
        if (b == null) {
            b = new TenantBilling();
            b.tenantId = tenantId;
        }
        b.provedor = "stripe";
        b.planoCodigo = "professional";
        b.status = "active";
        b.trialEndsAt = null;
        b.externalCustomerId = session.getCustomer();
        b.externalSubscriptionId = session.getSubscription();
        b.updatedAt = LocalDateTime.now();
        b.persist();
    }

}
