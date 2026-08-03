package com.aerosuite.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class JobCardAssinaturaIntegrityTest {

    @Test
    void sha256HexIsDeterministic() {
        byte[] data = "png-test".getBytes();
        String h1 = JobCardAssinaturaIntegrity.sha256Hex(data);
        String h2 = JobCardAssinaturaIntegrity.sha256Hex(data);
        assertEquals(h1, h2);
        assertEquals(64, h1.length());
    }

    @Test
    void sha256HexNullForEmpty() {
        assertNull(JobCardAssinaturaIntegrity.sha256Hex(null));
        assertNull(JobCardAssinaturaIntegrity.sha256Hex(new byte[0]));
    }

    @Test
    void verifyMatchesStoredHash() {
        byte[] png = "assinatura-png".getBytes();
        String hash = JobCardAssinaturaIntegrity.sha256Hex(png);
        assertEquals(Boolean.TRUE, JobCardAssinaturaIntegrity.verify(png, hash));
    }

    @Test
    void verifyDetectsTamper() {
        byte[] png = "assinatura-png".getBytes();
        assertEquals(Boolean.FALSE, JobCardAssinaturaIntegrity.verify(png, "f".repeat(64)));
    }

    @Test
    void verifyNullForLegacyWithoutHash() {
        assertNull(JobCardAssinaturaIntegrity.verify("x".getBytes(), null));
    }
}
