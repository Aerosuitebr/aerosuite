package com.aerosuite.util;

import java.util.Locale;
import java.util.Set;

/**
 * Sub-status da etapa de plano de ações corretivas (jornada RNC — etapa ACOES).
 */
public enum PlanoAcoesStatus {
    RASCUNHO,
    AGUARDANDO_APROVACAO,
    REJEITADO,
    APROVADO;

    private static final Set<String> VALUES = Set.of(
        "RASCUNHO", "AGUARDANDO_APROVACAO", "REJEITADO", "APROVADO"
    );

    public static PlanoAcoesStatus fromDb(String value) {
        if (value == null || value.isBlank()) {
            return RASCUNHO;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        try {
            return PlanoAcoesStatus.valueOf(normalized);
        } catch (IllegalArgumentException e) {
            return RASCUNHO;
        }
    }

    public static void requireValid(String value) {
        if (value != null && !value.isBlank() && !VALUES.contains(value.trim().toUpperCase(Locale.ROOT))) {
            throw new IllegalArgumentException("Status do plano de ações inválido: " + value);
        }
    }

    public String toDb() {
        return name();
    }
}
