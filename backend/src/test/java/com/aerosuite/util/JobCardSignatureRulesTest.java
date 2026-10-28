package com.aerosuite.util;

import org.junit.jupiter.api.Test;
import jakarta.ws.rs.BadRequestException;
import static org.junit.jupiter.api.Assertions.*;

class JobCardSignatureRulesTest {
    @Test void permitePrimeiraAssinaturaSemSubstituicao() {
        assertDoesNotThrow(() -> JobCardSignatureRules.assertReplacementAllowed(false, false, null, null));
    }
    @Test void exigeConfirmacaoParaSubstituir() {
        assertThrows(BadRequestException.class, () -> JobCardSignatureRules.assertReplacementAllowed(true, null, "hash", "hash"));
        assertThrows(BadRequestException.class, () -> JobCardSignatureRules.assertReplacementAllowed(true, false, "hash", "hash"));
    }
    @Test void rejeitaSubstituicaoDeAssinaturaAlteradaConcorrentemente() {
        assertThrows(BadRequestException.class, () -> JobCardSignatureRules.assertReplacementAllowed(true, true, "nova", "antiga"));
        assertThrows(BadRequestException.class, () -> JobCardSignatureRules.assertReplacementAllowed(true, true, "nova", null));
    }
    @Test void permiteSubstituicaoConfirmadaComVersaoAtualIncluindoLegados() {
        assertDoesNotThrow(() -> JobCardSignatureRules.assertReplacementAllowed(true, true, "atual", "atual"));
        assertDoesNotThrow(() -> JobCardSignatureRules.assertReplacementAllowed(true, true, null, null));
    }
}
