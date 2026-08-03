package com.aerosuite.security;

import org.junit.jupiter.api.Test;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class FuncionalidadeCodigoNormalizerTest {

    @Test
    void hyphenAndUnderscoreAreEquivalent() {
        Set<String> user = FuncionalidadeCodigoNormalizer.canonSet(Set.of("usuarios-externos"));
        assertTrue(FuncionalidadeCodigoNormalizer.userHasAny(user, new String[] {"USUARIOS_EXTERNOS"}));
        assertTrue(FuncionalidadeCodigoNormalizer.userHasAny(user, new String[] {"usuarios-externos"}));
    }

    @Test
    void allOfRequiresEveryCode() {
        Set<String> user = FuncionalidadeCodigoNormalizer.canonSet(Set.of("ORDEM_SERVICO", "CONSULTA_TROCAS_EVENTUAIS"));
        assertTrue(FuncionalidadeCodigoNormalizer.userHasAll(user, new String[] {"ORDEM_SERVICO"}));
        assertFalse(FuncionalidadeCodigoNormalizer.userHasAll(user, new String[] {"ORDEM_SERVICO", "PRODUTOS"}));
    }
}
