package com.aerosuite.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.util.ServerUrlUtil;
import jakarta.ws.rs.BadRequestException;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class PagarmeBillingGatewayTest {

    private PagarmeBillingGateway gateway;
    private PagarmeApiClient apiClient;

    @BeforeEach
    void setUp() throws Exception {
        gateway = new PagarmeBillingGateway();
        apiClient = new PagarmeApiClient();
        setField("apiClient", apiClient);
        setField("serverUrlUtil", new ServerUrlUtil());
    }

    @Test
    void providerIdIsPagarme() {
        assertEquals("pagarme", gateway.providerId());
    }

    @Test
    void notConfiguredWhenKeysMissing() {
        setKeys(null, null);
        assertFalse(gateway.isConfigured());
    }

    @Test
    void configuredWhenBothKeysPresent() {
        setKeys("sk_test_x", "pk_test_y");
        assertTrue(gateway.isConfigured());
    }

    @Test
    void checkoutThrowsWhenNotConfigured() {
        setKeys("", "pk");
        BadRequestException ex =
                assertThrows(BadRequestException.class, () -> gateway.createCheckoutSession(1L, "a@b.com"));
        assertTrue(ex.getMessage().contains("api.billing.pagarmeNotConfigured"));
    }

    @Test
    void webhookThrowsWhenNotConfigured() {
        setKeys(null, null);
        assertThrows(BadRequestException.class, () -> gateway.handleWebhook("{}", "sig"));
    }

    @Test
    void webhookRejectsInvalidSignature() {
        setKeys("sk_test_secret", "pk_test_pub");
        setOptional("webhookSecret", "whsec_test");
        BadRequestException ex = assertThrows(
                BadRequestException.class, () -> gateway.handleWebhook("{\"id\":\"e1\",\"type\":\"order.paid\"}", "bad"));
        assertTrue(ex.getMessage().contains("api.billing.pagarmeSignatureInvalid"));
    }

    @Test
    void validatesSha256Signature() {
        setKeys("sk_test_secret", "pk_test_pub");
        setOptional("webhookSecret", "whsec_test");
        String payload = "{\"id\":\"evt-1\",\"type\":\"order.paid\"}";
        String sig = "sha256=" + hmac(payload, "whsec_test", "HmacSHA256");
        assertTrue(gateway.validarAssinatura(payload, sig));
    }

    private static String hmac(String payload, String secret, String algorithm) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance(algorithm);
            mac.init(new javax.crypto.spec.SecretKeySpec(secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), algorithm));
            return java.util.HexFormat.of().formatHex(mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8)));
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }

    private void setKeys(String secret, String pub) {
        setOptional("secretKey", secret);
        setOptional("publicKey", pub);
    }

    private void setOptional(String fieldName, String value) {
        try {
            Field f = PagarmeBillingGateway.class.getDeclaredField(fieldName);
            f.setAccessible(true);
            f.set(gateway, Optional.ofNullable(value));
        } catch (ReflectiveOperationException e) {
            throw new RuntimeException(e);
        }
    }

    private void setField(String fieldName, Object value) throws Exception {
        Field f = PagarmeBillingGateway.class.getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(gateway, value);
    }
}
