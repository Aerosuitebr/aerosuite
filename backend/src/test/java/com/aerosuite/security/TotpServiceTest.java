package com.aerosuite.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class TotpServiceTest {

    @Test
    void generateAndVerifyRoundTrip() {
        String secret = TotpService.generateSecretBase32();
        assertNotNull(secret);
        assertTrue(secret.length() >= 16);

        String code = TotpService.hotp(TotpService.decodeBase32(secret), java.time.Instant.now().getEpochSecond() / 30);
        assertTrue(TotpService.verify(secret, code));
        assertFalse(TotpService.verify(secret, "000000"));
    }

    @Test
    void buildOtpAuthUriContainsIssuerAndSecret() {
        String secret = "JBSWY3DPEHPK3PXP";
        String uri = TotpService.buildOtpAuthUri("Aero Suite", "user@test.com", secret);
        assertTrue(uri.startsWith("otpauth://totp/"));
        assertTrue(uri.contains("secret=" + secret));
        assertTrue(uri.contains("issuer="));
    }
}
