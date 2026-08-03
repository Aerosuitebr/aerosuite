package com.aerosuite.billing;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class PagarmeApiClientTest {

    @Test
    void basicAuthEncodesSecretWithColon() {
        String auth = PagarmeApiClient.basicAuth("sk_test_abc");
        assertTrue(auth.startsWith("Basic "));
        String decoded = new String(java.util.Base64.getDecoder().decode(auth.substring(6)));
        assertEquals("sk_test_abc:", decoded);
    }

    @Test
    void detectsSandboxKey() {
        assertTrue(PagarmeApiClient.isSandboxKey("sk_test_xyz"));
    }
}
