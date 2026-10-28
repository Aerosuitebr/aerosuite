package com.aerosuite.util;

import java.util.Locale;
import java.util.Set;

/**
 * Sub-status da etapa de análise de causa (jornada RNC — etapa CAUSA).
 */
public enum AnaliseCausaStatus {
    RASCUNHO,
    AGUARDANDO_APROVACAO,
    REJEITADO,
    APROVADO;

    private static final Set<String> VALUES = Set.of(
        "RASCUNHO", "AGUARDANDO_APROVACAO", "REJEITADO", "APROVADO"
    );

    public static AnaliseCausaStatus fromDb(String value) {
        if (value == null || value.isBlank()) {
            return RASCUNHO;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        try {
            return AnaliseCausaStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return RASCUNHO;
        }
    }

    public static void requireValid(String value) {
        if (value != null && !value.isBlank() && !VALUES.contains(value.trim().toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Status de análise de causa inválido: " + value);
        }
    }

    public String toDb() {
        return name();
    }
}
