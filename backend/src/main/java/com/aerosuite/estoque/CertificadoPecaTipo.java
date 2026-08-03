package com.aerosuite.estoque;

import java.util.Locale;
import java.util.Optional;

/** Formulários típicos de certificação de peça aeronáutica. */
public enum CertificadoPecaTipo {
    FAA_8130_3,
    EASA_FORM1,
    ANAC,
    DUAL_RELEASE,
    OUTRO;

    public static Optional<CertificadoPecaTipo> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        String n = raw.trim().toUpperCase(Locale.ROOT).replace('-', '_').replace(' ', '_');
        try {
            return Optional.of(CertificadoPecaTipo.valueOf(n));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
