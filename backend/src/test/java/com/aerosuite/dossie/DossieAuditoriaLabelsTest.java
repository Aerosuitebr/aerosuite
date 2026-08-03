package com.aerosuite.dossie;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

class DossieAuditoriaLabelsTest {

    @Test
    void resolvesLocales() {
        assertTrue(DossieAuditoriaLabels.forLocale("en-US").title().contains("Audit"));
        assertTrue(DossieAuditoriaLabels.forLocale("es-ES").title().contains("auditoría"));
        assertTrue(DossieAuditoriaLabels.forLocale("fr-FR").title().contains("audit"));
        assertTrue(DossieAuditoriaLabels.forLocale("pt-BR").title().contains("Dossiê"));
    }

    @Test
    void osFieldLabelsPt() {
        assertEquals("Cliente", DossieAuditoriaLabels.osFieldLabels("pt-BR").get("clienteNome"));
    }
}
