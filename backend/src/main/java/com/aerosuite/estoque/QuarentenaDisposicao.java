package com.aerosuite.estoque;

import java.util.Locale;
import java.util.Optional;

/** Desfecho da análise de material em quarentena. */
public enum QuarentenaDisposicao {
    LIBERAR_ESTOQUE,
    DESCARTAR,
    DEVOLVER_FORNECEDOR;

    public static Optional<QuarentenaDisposicao> parse(String raw) {
        if (raw == null || raw.isBlank()) {
            return Optional.empty();
        }
        try {
            return Optional.of(QuarentenaDisposicao.valueOf(raw.trim().toUpperCase(Locale.ROOT)));
        } catch (IllegalArgumentException e) {
            return Optional.empty();
        }
    }
}
