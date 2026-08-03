package com.aerosuite.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import java.nio.charset.StandardCharsets;
import java.util.Base64;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Parsing de tokens externos legados (Base64 EXT:…) — sem {@code @QuarkusTest}
 * para não exigir MySQL, schedulers nem contexto multi-tenant no {@code mvn test}.
 */
class JwtTokenServiceExternoTokenTest {

    private JwtTokenService jwtTokenService;

    @BeforeEach
    void setUp() {
        jwtTokenService = new JwtTokenService();
    }

    @Test
    void parsesExternoLegacyToken() {
        String raw = Base64.getEncoder().encodeToString(
                "EXT:42:cliente@demo.local:1234567890".getBytes(StandardCharsets.UTF_8));
        var parsed = jwtTokenService.tryParseExternoLegacyToken(raw);
        assertTrue(parsed.isPresent());
        assertEquals(42, parsed.get().userId());
        assertEquals("cliente@demo.local", parsed.get().email());
        assertNull(parsed.get().orgTenantId());
        assertTrue(jwtTokenService.isExternoLegacyToken(raw));
    }

    @Test
    void parsesExternoLegacyTokenWithOrgTenant() {
        String raw = Base64.getEncoder().encodeToString(
                "EXT:7:u@t.local:99:1234567890".getBytes(StandardCharsets.UTF_8));
        var parsed = jwtTokenService.tryParseExternoLegacyToken(raw);
        assertTrue(parsed.isPresent());
        assertEquals(7, parsed.get().userId());
        assertEquals(99L, parsed.get().orgTenantId());
    }
}
