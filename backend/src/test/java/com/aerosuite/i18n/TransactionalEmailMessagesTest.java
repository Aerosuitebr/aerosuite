package com.aerosuite.i18n;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class TransactionalEmailMessagesTest {

    @Test
    void blingNfeAutorizada_localizesSubject() {
        var en = TransactionalEmailMessages.blingNfeAutorizada(
                "en-US", "Acme", "99", "Authorized", "P-1", "https://example.com/danfe");
        assertTrue(en.subject().contains("Invoice"));
        assertTrue(en.htmlBody().contains("Hello Acme"));
    }

    @Test
    void passwordReset_localizesFourLocales() {
        var en = TransactionalEmailMessages.passwordReset("en-US", "https://x/reset", false);
        assertTrue(en.subject().toLowerCase().contains("password"));
        assertTrue(en.htmlBody().contains("https://x/reset"));

        var pt = TransactionalEmailMessages.passwordReset("pt-BR", "https://x/reset", true);
        assertTrue(pt.subject().contains("Portal"));
    }

    @Test
    void backupCompleted_localizesSubject() {
        var fr = TransactionalEmailMessages.backupCompleted("fr-FR", "aero", "/tmp/bak", "1.00", 10);
        assertTrue(fr.subject().contains("Sauvegarde"));
    }

    @Test
    void ticketResolved_localizesSubject() {
        var es = TransactionalEmailMessages.ticketResolved("es-ES", "T-1", "Falla");
        assertTrue(es.subject().contains("T-1"));
    }

    @Test
    void withBrand_replacesDefaultCommercialName() {
        var raw = TransactionalEmailMessages.passwordReset("pt-BR", "https://x/reset", false);
        var branded = TransactionalEmailMessages.withBrand(raw, "Bellows MRO");
        assertTrue(branded.subject().contains("Bellows MRO"));
        assertTrue(!branded.subject().contains("Aero Suite"));
        assertTrue(branded.htmlBody().contains("Bellows MRO"));
    }

    @Test
    void propostaPortalAvailable_localizesLinks() {
        var en = TransactionalEmailMessages.propostaPortalAvailable(
                "en-US", "Acme", "P-9", "https://login", "https://prop");
        assertTrue(en.htmlBody().contains("https://prop"));
        assertTrue(en.htmlBody().contains("View proposal"));
    }
}
