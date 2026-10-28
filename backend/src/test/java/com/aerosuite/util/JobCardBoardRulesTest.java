package com.aerosuite.util;

import org.junit.jupiter.api.Test;
import java.util.List;
import static org.junit.jupiter.api.Assertions.*;

class JobCardBoardRulesTest {
    @Test void iniciaSomentePelaColunaAFazer() {
        assertEquals(List.of("EM_ANDAMENTO"), JobCardBoardRules.allowedTargets("A_FAZER", 0));
    }
    @Test void naoPermiteConcluirSemAsDuasAssinaturas() {
        assertTrue(JobCardBoardRules.allowedTargets("EM_ANDAMENTO", 0).isEmpty());
        assertTrue(JobCardBoardRules.allowedTargets("EM_ANDAMENTO", 1).isEmpty());
        assertEquals(List.of("CONCLUIDO"), JobCardBoardRules.allowedTargets("EM_ANDAMENTO", 2));
    }
    @Test void naoLimpaPendenciasNemReabreServicoConcluidoPeloArraste() {
        for (String fase : List.of("AGUARDANDO_PECA", "CONCLUIDO", "DESCONHECIDA")) {
            assertTrue(JobCardBoardRules.allowedTargets(fase, 2).isEmpty());
        }
    }
}
