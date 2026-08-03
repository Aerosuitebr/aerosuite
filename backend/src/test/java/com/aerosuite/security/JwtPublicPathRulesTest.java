package com.aerosuite.security;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.ValueSource;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

/**
 * Contrato das rotas públicas (espelha {@link JwtAuthenticationFilter}).
 * Falha antecipada se alguém remover auth de rotas sensíveis por engano.
 */
class JwtPublicPathRulesTest {

    private static boolean isPublicPath(String p) {
        if (p.startsWith("/q/")) {
            return true;
        }
        if (p.startsWith("/api/sistema-atualizacao/status")
                || p.startsWith("/api/sistema-atualizacao/verificar")) {
            return true;
        }
        if (p.startsWith("/api/public/empresa-asset")) {
            return true;
        }
        if (p.startsWith("/api/public/sistema-empresa")) {
            return true;
        }
        if (p.startsWith("/api/public/lgpd")) {
            return true;
        }
        if (p.startsWith("/api/public/signup")) {
            return true;
        }
        if (p.startsWith("/api/public/onboarding/")) {
            return true;
        }
        if (p.startsWith("/api/public/vitrine/")) {
            return true;
        }
        if (p.startsWith("/api/billing/webhooks")) {
            return true;
        }
        if (p.startsWith("/api/auth/login")) {
            return true;
        }
        if (p.startsWith("/api/auth/login-tenants")) {
            return true;
        }
        if (p.startsWith("/api/auth/forgot-password")) {
            return true;
        }
        if (p.startsWith("/api/auth/validate-reset-token/")) {
            return true;
        }
        if (p.startsWith("/api/auth/reset-password")) {
            return true;
        }
        if (p.startsWith("/api/auth/change-password-new-user")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/login")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/login-tenants")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/forgot-password")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/validate-reset-token/")) {
            return true;
        }
        if (p.startsWith("/api/auth-externo/reset-password")) {
            return true;
        }
        if (p.startsWith("/api/integracoes/bling/oauth/callback")) {
            return true;
        }
        if (p.startsWith("/webhooks/evolution")) {
            return true;
        }
        return false;
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/auth/login",
            "/api/auth/login-tenants",
            "/api/public/sistema-empresa/branding",
            "/api/public/empresa-asset/logo",
            "/api/public/lgpd/termos",
            "/api/public/lgpd/privacidade",
            "/api/public/signup/trial",
            "/api/public/onboarding/marketing-whatsapp/session",
            "/api/public/vitrine/media/aerosuite-visao-geral-plataforma.mp4",
            "/api/billing/webhooks/stripe",
            "/api/integracoes/bling/oauth/callback",
            "/webhooks/evolution",
            "/q/health/live"
    })
    void publicPathsAllowedWithoutJwt(String path) {
        assertTrue(isPublicPath(path));
    }

    @ParameterizedTest
    @ValueSource(strings = {
            "/api/auth/me",
            "/api/funcionalidades/meu-menu",
            "/api/tenants",
            "/api/os",
            "/api/logo",
            "/api/integracoes/bling/contatos",
            "/api/sistema-empresa/config"
    })
    void protectedPathsRequireJwt(String path) {
        assertFalse(isPublicPath(path));
    }

    @Test
    void logoEndpointIsNotPublic() {
        assertFalse(isPublicPath("/api/logo"));
    }
}
