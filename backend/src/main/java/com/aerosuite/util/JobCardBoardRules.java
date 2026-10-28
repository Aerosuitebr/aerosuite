package com.aerosuite.util;

import java.util.List;

/** As fases continuam derivadas da execução, das peças e das assinaturas. */
public final class JobCardBoardRules {
    private JobCardBoardRules() {}

    public static List<String> allowedTargets(String fase, int assinaturas) {
        if ("A_FAZER".equals(fase)) return List.of("EM_ANDAMENTO");
        if ("EM_ANDAMENTO".equals(fase) && assinaturas >= 2) return List.of("CONCLUIDO");
        return List.of();
    }
}
