package com.aerosuite.service;

import java.lang.reflect.Field;
import java.util.Optional;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EnvironmentLabelServiceTest {

    @Test
    void defaultsWhenUnset() throws Exception {
        EnvironmentLabelService svc = service(Optional.empty(), Optional.empty(), Optional.empty());
        assertEquals("", svc.environmentName());
        assertEquals("", svc.environmentKind());
        assertFalse(svc.showEnvironmentBanner());
        assertEquals("Aero Suite", svc.mfaIssuer());
        assertEquals("Aero Suite Control", svc.platformOpsMfaIssuer());
    }

    @Test
    void productionLabelsAndMfaIssuer() throws Exception {
        EnvironmentLabelService svc = service(
                Optional.of("Aero Suite PROD"),
                Optional.of("production"),
                Optional.empty());
        assertTrue(svc.isProduction());
        assertTrue(svc.showEnvironmentBanner());
        assertEquals("Aero Suite PROD", svc.mfaIssuer());
        assertEquals("Aero Suite PROD · Controle", svc.platformOpsMfaIssuer());
    }

    @Test
    void homologKindIsRecognized() throws Exception {
        EnvironmentLabelService svc = service(
                Optional.of("Aero Suite HML"),
                Optional.of("homolog"),
                Optional.empty());
        assertTrue(svc.isHomolog());
        assertTrue(svc.showEnvironmentBanner());
    }

    @Test
    void platformOpsIssuerOverrideWins() throws Exception {
        EnvironmentLabelService svc = service(
                Optional.of("Aero Suite PROD"),
                Optional.of("production"),
                Optional.of("Custom Issuer"));
        assertEquals("Custom Issuer", svc.platformOpsMfaIssuer());
    }

    private static EnvironmentLabelService service(
            Optional<String> name,
            Optional<String> kind,
            Optional<String> opsIssuer) throws Exception {
        EnvironmentLabelService svc = new EnvironmentLabelService();
        setField(svc, "environmentName", name);
        setField(svc, "environmentKind", kind);
        setField(svc, "platformOpsMfaIssuerOverride", opsIssuer);
        return svc;
    }

    private static void setField(Object target, String fieldName, Object value) throws Exception {
        Field field = EnvironmentLabelService.class.getDeclaredField(fieldName);
        field.setAccessible(true);
        field.set(target, value);
    }
}
