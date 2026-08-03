package com.aerosuite.service;

import jakarta.enterprise.context.ApplicationScoped;
import java.util.Optional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/** Nome do ambiente (banner UI, emissor TOTP no autenticador). */
@ApplicationScoped
public class EnvironmentLabelService {

    @ConfigProperty(name = "aero.suite.environment.name")
    Optional<String> environmentName;

    @ConfigProperty(name = "aero.suite.environment.kind")
    Optional<String> environmentKind;

    @ConfigProperty(name = "aero.suite.platform.ops.mfa-issuer")
    Optional<String> platformOpsMfaIssuerOverride;

    public String environmentName() {
        return environmentName.orElse("").trim();
    }

    public String environmentKind() {
        return environmentKind.orElse("").trim().toLowerCase();
    }

    public boolean showEnvironmentBanner() {
        return !environmentName().isBlank() || isProduction() || isHomolog();
    }

    public boolean isProduction() {
        return "production".equals(environmentKind()) || "prod".equals(environmentKind());
    }

    public boolean isHomolog() {
        return "homolog".equals(environmentKind()) || "staging".equals(environmentKind());
    }

    /** Emissor TOTP para login interno (Google Authenticator, etc.). */
    public String mfaIssuer() {
        String name = environmentName();
        return name.isBlank() ? "Aero Suite" : name;
    }

    /** Emissor TOTP do plano de controle (área elevada). */
    public String platformOpsMfaIssuer() {
        String override = platformOpsMfaIssuerOverride.orElse("").trim();
        if (!override.isBlank()) {
            return override;
        }
        String name = environmentName();
        if (!name.isBlank()) {
            return name + " · Controle";
        }
        return "Aero Suite Control";
    }
}
