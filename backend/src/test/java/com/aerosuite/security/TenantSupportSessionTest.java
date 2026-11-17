package com.aerosuite.security;

import com.aerosuite.domain.Usuario;
import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.*;

class TenantSupportSessionTest {
    @Test
    void supportTokenPreservesActorAndTargetsOnlyOneTenant() {
        JwtTokenService tokens = new JwtTokenService();
        tokens.jwtSecret = "separate-test-secret-for-token-signing";
        Usuario operator = new Usuario();
        operator.id = 37;
        operator.orgTenantId = 1L;
        operator.email = "operator@example.test";
        Instant expiry = Instant.ofEpochSecond(Instant.now().getEpochSecond() + 120);

        String support = tokens.mintTenantSupportToken(operator, 20, expiry);
        var claims = tokens.parseAndVerifyTenantSupport(support).orElseThrow();
        assertEquals("37", claims.getSubject());
        assertEquals(20L, JwtTokenService.extractTenantIdFromClaims(claims));
        assertEquals(expiry, claims.getExpiration().toInstant());
        assertTrue(tokens.parseAndVerifyInternal(support).isEmpty());
        assertTrue(tokens.parseAndVerifyPlatformOps(support).isEmpty());
        assertTrue(tokens.parseAndVerifyTenantSupport(tokens.mintInternalToken(operator)).isEmpty());
        assertTrue(tokens.parseAndVerifyTenantSupport(
                tokens.mintTenantSupportToken(operator, 20, Instant.now().minusSeconds(1))).isEmpty());
    }

    @Test
    void supportSessionAllowsTenantManagementWithoutControlPlaneOrCredentialChanges() {
        assertTrue(TenantSupportAuthorizationFilter.isAllowed("/api/os", "GET"));
        assertTrue(TenantSupportAuthorizationFilter.isAllowed("/api/perfis", "POST"));
        assertTrue(TenantSupportAuthorizationFilter.isAllowed("/api/auth/me", "GET"));
        assertFalse(TenantSupportAuthorizationFilter.isAllowed("/api/auth/me/foto", "PUT"));
        assertFalse(TenantSupportAuthorizationFilter.isAllowed("/api/platform/control/overview", "GET"));
        assertFalse(TenantSupportAuthorizationFilter.isAllowed("/api/platform-ops/elevate", "POST"));
        assertFalse(TenantSupportAuthorizationFilter.isAllowed("/api/tenants", "POST"));
        assertFalse(TenantSupportAuthorizationFilter.isAllowed("/api/funcionalidades/1", "DELETE"));
        assertFalse(TenantSupportAuthorizationFilter.isAllowed("/api/backup-config", "GET"));
    }
}
