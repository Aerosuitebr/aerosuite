package com.aerosuite.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class FiscalCertificateUtilTest {

    @Test
    void validateTipo_acceptsA1AndA3() {
        assertEquals("A1", FiscalCertificateUtil.normalizeTipo("a1"));
        assertEquals("A3", FiscalCertificateUtil.normalizeTipo("A3"));
    }

    @Test
    void validateTipo_rejectsInvalid() {
        assertThrows(IllegalArgumentException.class, () -> FiscalCertificateUtil.validateTipo("A2"));
        assertThrows(IllegalArgumentException.class, () -> FiscalCertificateUtil.validateTipo(""));
    }
}
