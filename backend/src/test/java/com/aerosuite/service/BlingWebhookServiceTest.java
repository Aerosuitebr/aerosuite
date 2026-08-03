package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.integration.bling.BlingPlatformConfig;
import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.Test;

class BlingWebhookServiceTest {

    @Test
    void validarAssinatura_acceptsSha256Prefix() throws Exception {
        BlingWebhookService svc = serviceWithSecret("test-secret-key-32chars-minimum!!");
        String body = "{\"eventId\":\"1\",\"event\":\"pedido.updated\"}";
        String secret = "test-secret-key-32chars-minimum!!";
        String sig = hmac(body, secret);

        assertTrue(svc.validarAssinatura(body, sig));
        assertTrue(svc.validarAssinatura(body, "sha256=" + sig));
    }

    @Test
    void validarAssinatura_rejectsWrongSignature() throws Exception {
        BlingWebhookService svc = serviceWithSecret("test-secret-key-32chars-minimum!!");
        assertFalse(svc.validarAssinatura("{}", "deadbeef"));
        assertFalse(svc.validarAssinatura("{}", null));
        assertFalse(svc.validarAssinatura("{}", ""));
    }

    private static BlingWebhookService serviceWithSecret(String secret) throws Exception {
        BlingPlatformConfig cfg = new BlingPlatformConfig();
        setOptionalField(cfg, "clientSecret", secret);

        BlingWebhookService svc = new BlingWebhookService();
        Field pf = BlingWebhookService.class.getDeclaredField("platformConfig");
        pf.setAccessible(true);
        pf.set(svc, cfg);
        return svc;
    }

    private static void setOptionalField(Object target, String fieldName, String value) throws Exception {
        Field f = target.getClass().getDeclaredField(fieldName);
        f.setAccessible(true);
        f.set(target, Optional.of(value));
    }

    private static String hmac(String payload, String secret) {
        try {
            javax.crypto.Mac mac = javax.crypto.Mac.getInstance("HmacSHA256");
            mac.init(new javax.crypto.spec.SecretKeySpec(
                    secret.getBytes(java.nio.charset.StandardCharsets.UTF_8), "HmacSHA256"));
            byte[] hash = mac.doFinal(payload.getBytes(java.nio.charset.StandardCharsets.UTF_8));
            return java.util.HexFormat.of().formatHex(hash);
        } catch (Exception e) {
            throw new RuntimeException(e);
        }
    }
}
