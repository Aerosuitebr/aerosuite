package com.aerosuite.billing;

import com.aerosuite.domain.BillingWebhookEvent;
import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.TenantBilling;
import com.aerosuite.dto.BillingCheckoutResponseDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.util.ServerUrlUtil;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import java.time.LocalDateTime;
import java.util.Locale;
import java.util.Map;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Provedor Pagar.me — checkout via payment link (assinatura) e webhooks com idempotência.
 */
@ApplicationScoped
public class PagarmeBillingGateway implements BillingGateway {

    private static final Logger LOG = Logger.getLogger(PagarmeBillingGateway.class);
    private static final ObjectMapper MAPPER = new ObjectMapper();
    private static final String PROVIDER = "pagarme";

    @Inject
    PagarmeApiClient apiClient;

    @Inject
    ServerUrlUtil serverUrlUtil;

    @ConfigProperty(name = "aero.suite.billing.pagarme.secret-key")
    java.util.Optional<String> secretKey;

    @ConfigProperty(name = "aero.suite.billing.pagarme.public-key")
    java.util.Optional<String> publicKey;

    @ConfigProperty(name = "aero.suite.billing.pagarme.webhook-secret")
    java.util.Optional<String> webhookSecret;

    @ConfigProperty(name = "aero.suite.billing.pagarme.base-url")
    java.util.Optional<String> baseUrl;

    @ConfigProperty(name = "aero.suite.billing.pagarme.plan-id")
    java.util.Optional<String> configuredPlanId;

    @ConfigProperty(name = "aero.suite.billing.pagarme.amount-cents", defaultValue = "9900")
    int amountCents;

    @ConfigProperty(name = "aero.suite.billing.pagarme.plan-name", defaultValue = "Aero Suite Professional")
    String planName;

    @ConfigProperty(name = "aero.suite.billing.pagarme.plan-interval", defaultValue = "month")
    String planInterval;

    @ConfigProperty(name = "aero.suite.billing.pagarme.success-url")
    java.util.Optional<String> successUrl;

    @ConfigProperty(name = "aero.suite.billing.pagarme.cancel-url")
    java.util.Optional<String> cancelUrl;

    private volatile String cachedPlanId;

    @Override
    public String providerId() {
        return PROVIDER;
    }

    @Override
    public boolean isConfigured() {
        return secretKey.filter(s -> !s.isBlank()).isPresent()
                && publicKey.filter(s -> !s.isBlank()).isPresent();
    }

    @Override
    public BillingCheckoutResponseDto createCheckoutSession(long tenantId, String customerEmail) {
        if (!isConfigured()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_PAGARME_NOT_CONFIGURED));
        }
        String secret = secretKey.get().trim();
        Tenant tenant = Tenant.findById(tenantId);
        String codigo = tenant != null ? tenant.codigo : String.valueOf(tenantId);

        try {
            String planId = resolvePlanId(secret);
            JsonNode link = apiClient.createSubscriptionPaymentLink(
                    resolveBaseUrl(secret),
                    secret,
                    planId,
                    Map.of(
                            "tenant_id", String.valueOf(tenantId),
                            "tenant_codigo", codigo,
                            "customer_email", customerEmail != null ? customerEmail.trim().toLowerCase(Locale.ROOT) : ""));

            String linkId = PagarmeApiClient.text(link, "id");
            String checkoutUrl = PagarmeApiClient.text(link, "url");
            if (linkId == null || checkoutUrl == null) {
                throw new PagarmeApiClient.PagarmeApiException(0, "Resposta Pagar.me sem id/url do payment link");
            }

            persistCheckoutPending(tenantId, planId, linkId);

            BillingCheckoutResponseDto out = new BillingCheckoutResponseDto();
            out.sessionId = linkId;
            out.checkoutUrl = checkoutUrl;
            out.provedor = PROVIDER;
            out.message = ApiI18nMessages.encode(ApiI18nMessages.BILLING_PAGARME_REDIRECT);
            return out;
        } catch (PagarmeApiClient.PagarmeApiException e) {
            LOG.errorf(e, "Pagar.me checkout failed tenant=%d status=%d", tenantId, e.statusCode);
            throw new BadRequestException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.BILLING_PAGARME_SESSION_FAILED, e.getMessage()));
        }
    }

    @Override
    public void handleWebhook(String payload, String signatureHeader) {
        if (!isConfigured()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_PAGARME_WEBHOOK_NOT_CONFIGURED));
        }
        if (!validarAssinatura(payload, signatureHeader)) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_PAGARME_SIGNATURE_INVALID));
        }
        processWebhookPayload(payload);
    }

    @Transactional
    void persistCheckoutPending(long tenantId, String planId, String linkId) {
        TenantBilling b = TenantBilling.findByTenantId(tenantId);
        if (b == null) {
            b = new TenantBilling();
            b.tenantId = tenantId;
        }
        b.provedor = PROVIDER;
        b.status = "checkout_pending";
        b.pagarmePlanId = planId;
        b.pagarmeOrderId = linkId;
        b.updatedAt = LocalDateTime.now();
        b.persist();
    }

    @Transactional
    void processWebhookPayload(String payload) {
        JsonNode root;
        try {
            root = MAPPER.readTree(payload);
        } catch (Exception e) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.BILLING_PAGARME_PAYLOAD_INVALID));
        }

        String eventId = firstText(root, "id");
        if (eventId == null || eventId.isBlank()) {
            eventId = "hash-" + Integer.toHexString(payload.hashCode());
        }
        if (BillingWebhookEvent.exists(PROVIDER, eventId)) {
            LOG.infof("Webhook Pagar.me duplicado ignorado: %s", eventId);
            return;
        }

        String eventType = firstText(root, "type");
        JsonNode data = root.get("data");
        if (data == null) {
            data = root;
        }

        applyBusinessEvent(eventType, data);

        BillingWebhookEvent row = new BillingWebhookEvent();
        row.provider = PROVIDER;
        row.eventId = eventId;
        row.eventType = eventType;
        row.processedAt = LocalDateTime.now();
        row.persist();
    }

    private void applyBusinessEvent(String eventType, JsonNode data) {
        if (eventType == null) {
            return;
        }
        String normalized = eventType.toLowerCase(Locale.ROOT);
        if (isActivationEvent(normalized)) {
            activateFromWebhook(data);
            return;
        }
        if ("subscription.canceled".equals(normalized) || "subscription.expired".equals(normalized)) {
            cancelFromWebhook(data);
            return;
        }
        if ("charge.payment_failed".equals(normalized) || "order.payment_failed".equals(normalized)) {
            markPastDue(data);
        }
    }

    private static boolean isActivationEvent(String eventType) {
        return "order.paid".equals(eventType)
                || "charge.paid".equals(eventType)
                || "subscription.created".equals(eventType)
                || "checkout.closed".equals(eventType)
                || "invoice.paid".equals(eventType);
    }

    @Transactional
    void activateFromWebhook(JsonNode data) {
        TenantBilling billing = resolveBilling(data);
        if (billing == null) {
            LOG.warn("Webhook Pagar.me sem tenant resolvível");
            return;
        }
        billing.provedor = PROVIDER;
        billing.planoCodigo = "professional";
        billing.status = "active";
        billing.trialEndsAt = null;
        String customerId = firstText(data, "customer_id");
        if (customerId == null) {
            customerId = firstText(data.get("customer"), "id");
        }
        if (customerId != null) {
            billing.externalCustomerId = customerId;
        }
        String subscriptionId = firstText(data, "subscription_id");
        if (subscriptionId == null) {
            subscriptionId = firstText(data, "id");
        }
        if (subscriptionId != null && subscriptionId.startsWith("sub_")) {
            billing.externalSubscriptionId = subscriptionId;
        }
        String paymentLinkId = extractPaymentLinkId(data);
        if (paymentLinkId != null) {
            billing.pagarmeOrderId = paymentLinkId;
        }
        billing.updatedAt = LocalDateTime.now();
        billing.persist();
        LOG.infof("Pagar.me ativou tenant %d via webhook", billing.tenantId);
    }

    @Transactional
    void cancelFromWebhook(JsonNode data) {
        TenantBilling billing = resolveBilling(data);
        if (billing == null) {
            return;
        }
        billing.status = "canceled";
        billing.updatedAt = LocalDateTime.now();
        billing.persist();
    }

    @Transactional
    void markPastDue(JsonNode data) {
        TenantBilling billing = resolveBilling(data);
        if (billing == null) {
            return;
        }
        billing.status = "past_due";
        billing.updatedAt = LocalDateTime.now();
        billing.persist();
    }

    private TenantBilling resolveBilling(JsonNode data) {
        Long tenantId = extractTenantId(data);
        if (tenantId != null) {
            TenantBilling byTenant = TenantBilling.findByTenantId(tenantId);
            if (byTenant != null) {
                return byTenant;
            }
        }
        String paymentLinkId = extractPaymentLinkId(data);
        if (paymentLinkId != null) {
            TenantBilling byLink = TenantBilling.findByPagarmeOrderId(paymentLinkId);
            if (byLink != null) {
                return byLink;
            }
        }
        String subscriptionId = firstText(data, "subscription_id");
        if (subscriptionId != null) {
            TenantBilling bySub = TenantBilling.find("externalSubscriptionId", subscriptionId).firstResult();
            if (bySub != null) {
                return bySub;
            }
        }
        return null;
    }

    private static Long extractTenantId(JsonNode data) {
        if (data == null) {
            return null;
        }
        JsonNode metadata = data.get("metadata");
        if (metadata != null) {
            String tenantId = firstText(metadata, "tenant_id");
            if (tenantId != null) {
                try {
                    return Long.parseLong(tenantId.trim());
                } catch (NumberFormatException ignored) {
                    // ignore
                }
            }
        }
        return null;
    }

    private static String extractPaymentLinkId(JsonNode data) {
        if (data == null) {
            return null;
        }
        String linkId = firstText(data, "payment_link_id");
        if (linkId != null) {
            return linkId;
        }
        linkId = firstText(data.get("checkout"), "id");
        if (linkId != null && linkId.startsWith("pl_")) {
            return linkId;
        }
        String id = firstText(data, "id");
        if (id != null && id.startsWith("pl_")) {
            return id;
        }
        return null;
    }

    private String resolvePlanId(String secret) throws PagarmeApiClient.PagarmeApiException {
        String fromConfig = configuredPlanId.filter(s -> !s.isBlank()).map(String::trim).orElse(null);
        if (fromConfig != null) {
            return fromConfig;
        }
        if (cachedPlanId != null) {
            return cachedPlanId;
        }
        synchronized (this) {
            if (cachedPlanId != null) {
                return cachedPlanId;
            }
            JsonNode plan = apiClient.createSubscriptionPlan(
                    resolveBaseUrl(secret),
                    secret,
                    planName,
                    amountCents,
                    planInterval);
            String planId = PagarmeApiClient.text(plan, "id");
            if (planId == null || planId.isBlank()) {
                throw new PagarmeApiClient.PagarmeApiException(0, "Pagar.me não retornou plan_id");
            }
            cachedPlanId = planId;
            LOG.infof("Pagar.me plano criado automaticamente: %s", planId);
            return planId;
        }
    }

    private String resolveBaseUrl(String secret) {
        String configured = baseUrl.filter(s -> !s.isBlank()).map(String::trim).orElse(null);
        if (configured != null) {
            return configured;
        }
        return PagarmeApiClient.isSandboxKey(secret)
                ? "https://sdx-api.pagar.me/core/v5"
                : "https://api.pagar.me/core/v5";
    }

    boolean validarAssinatura(String payload, String signatureHeader) {
        if (signatureHeader == null || signatureHeader.isBlank()) {
            return false;
        }
        String secret = webhookSecret.filter(s -> !s.isBlank()).map(String::trim).orElse(secretKey.orElse("").trim());
        if (secret.isEmpty()) {
            return false;
        }
        String received = signatureHeader.trim();
        if (received.startsWith("sha256=")) {
            received = received.substring(7);
        } else if (received.startsWith("sha1=")) {
            received = received.substring(5);
        }
        String expectedSha256 = hmacHex(payload, secret, "HmacSHA256");
        if (expectedSha256.equalsIgnoreCase(received)) {
            return true;
        }
        String expectedSha1 = hmacHex(payload, secret, "HmacSHA1");
        return expectedSha1.equalsIgnoreCase(received);
    }

    private static String hmacHex(String payload, String secret, String algorithm) {
        try {
            Mac mac = Mac.getInstance(algorithm);
            mac.init(new SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), algorithm));
            byte[] hash = mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }

    private static String firstText(JsonNode node, String field) {
        if (node == null || !node.has(field) || node.get(field).isNull()) {
            return null;
        }
        return node.get(field).asText();
    }
}
