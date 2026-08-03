package com.aerosuite.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.lang.reflect.Field;
import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Token interno legado Base64 — flag {@code aero.suite.auth.allow-legacy-internal-base64}.
 */
class JwtTokenServiceLegacyInternalTest {

    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        jwtTokenService = new JwtTokenService();
    }

    @Test
    void legacyInternalDisabledByDefault() throws Exception {
        setAllowLegacy(false);
        String raw = legacyRaw(1, "user@test.local");
        assertTrue(jwtTokenService.tryParseLegacyInternalBase64(raw).isEmpty());
    }

    @Test
    void legacyInternalParsesWhenEnabled() throws Exception {
        setAllowLegacy(true);
        String raw = legacyRaw(9, "legacy@test.local");
        var parsed = jwtTokenService.tryParseLegacyInternalBase64(raw);
        assertTrue(parsed.isPresent());
        assertEquals(9, parsed.get().userId());
        assertEquals("legacy@test.local", parsed.get().email());
    }

    private static String legacyRaw(int userId, String email) {
        return Base64.getEncoder().encodeToString(
                (userId + ":" + email + ":1234567890").getBytes(StandardCharsets.UTF_8));
    }

    private void setAllowLegacy(boolean allowed) throws Exception {
        Field f = JwtTokenService.class.getDeclaredField("allowLegacyInternalBase64");
        f.setAccessible(true);
        f.setBoolean(jwtTokenService, allowed);
    }
}
