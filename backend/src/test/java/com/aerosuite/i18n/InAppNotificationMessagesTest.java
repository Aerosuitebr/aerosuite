package com.aerosuite.i18n;

import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class InAppNotificationMessagesTest {

    @Test
    void blingNfeAuthorized_localizesFourLocales() {
        var pt = InAppNotificationMessages.blingNfeAuthorized("pt-BR", "42", "Autorizada", "P-100");
        assertTrue(pt.title().contains("NF-e"));
        assertTrue(pt.message().contains("P-100"));

        var en = InAppNotificationMessages.blingNfeAuthorized("en-US", "42", "Authorized", "P-100");
        assertTrue(en.title().toLowerCase().contains("invoice"));
        assertTrue(en.message().toLowerCase().contains("proposal"));

        var es = InAppNotificationMessages.blingNfeAuthorized("es-ES", "42", "Autorizada", "P-100");
        assertTrue(es.title().contains("Factura"));

        var fr = InAppNotificationMessages.blingNfeAuthorized("fr-FR", "42", "Autorisée", "P-100");
        assertTrue(fr.title().contains("Facture"));
    }

    @Test
    void adSbDailyAlert_localizesTotals() {
        var en = InAppNotificationMessages.adSbDailyAlert("en-US", 5, 30, 2, 3);
        assertTrue(en.title().contains("5"));
        assertTrue(en.message().contains("2"));
        assertTrue(en.message().contains("3"));
    }

    @Test
    void ticketStatusChanged_localizesFourLocales() {
        var pt = InAppNotificationMessages.ticketStatusChanged("pt-BR", "T-1", "Titulo", "ABERTO", "EM_ANDAMENTO");
        assertTrue(pt.title().contains("T-1"));
        assertTrue(pt.message().contains("Aberto"));

        var en = InAppNotificationMessages.ticketStatusChanged("en-US", "T-1", "Title", "ABERTO", "EM_ANDAMENTO");
        assertTrue(en.title().toLowerCase().contains("status"));

        var es = InAppNotificationMessages.ticketStatusChanged("es-ES", "T-1", "Titulo", "ABERTO", "EM_ANDAMENTO");
        assertTrue(es.title().contains("Estado"));

        var fr = InAppNotificationMessages.ticketStatusChanged("fr-FR", "T-1", "Titre", "ABERTO", "EM_ANDAMENTO");
        assertTrue(fr.title().contains("Statut"));
    }

    @Test
    void userLocaleResolver_normalizesAliases() {
        org.junit.jupiter.api.Assertions.assertEquals("en-US", UserLocaleResolver.normalize("en"));
        org.junit.jupiter.api.Assertions.assertEquals("pt-BR", UserLocaleResolver.normalize(null));
    }

    @Test
    void userLocaleResolver_fromAcceptLanguage() {
        org.junit.jupiter.api.Assertions.assertEquals("en-US", UserLocaleResolver.fromAcceptLanguage("en-US,pt-BR;q=0.9"));
        org.junit.jupiter.api.Assertions.assertEquals("pt-BR", UserLocaleResolver.fromAcceptLanguage(null));
    }

    @Test
    void lgpdDefaultDocuments_fourLocales() {
        org.junit.jupiter.api.Assertions.assertTrue(LgpdDefaultDocuments.termosBody("en-US").contains("Terms of Use"));
        org.junit.jupiter.api.Assertions.assertTrue(LgpdDefaultDocuments.privacidadeBody("fr-FR").contains("Politique"));
        org.junit.jupiter.api.Assertions.assertEquals("Termos de Uso", LgpdDefaultDocuments.title("termos", "pt-BR"));
    }

    @Test
    void userLocaleResolver_resolvesClientePropostaIdioma() {
        com.aerosuite.domain.ClienteProposta c = new com.aerosuite.domain.ClienteProposta();
        c.idioma = "en-US";
        org.junit.jupiter.api.Assertions.assertEquals("en-US", UserLocaleResolver.resolve(c));
        c.idioma = null;
        org.junit.jupiter.api.Assertions.assertEquals("pt-BR", UserLocaleResolver.resolve(c));
    }

    @Test
    void userLocaleResolver_resolvesUsuarioExternoWithoutCliente() {
        com.aerosuite.domain.UsuarioExterno ue = new com.aerosuite.domain.UsuarioExterno();
        org.junit.jupiter.api.Assertions.assertEquals("pt-BR", UserLocaleResolver.resolve(ue));
    }

    @Test
    void capacidadeFila_localizesStageAndQueueUpdated() {
        org.junit.jupiter.api.Assertions.assertEquals("Waiting", CapacidadeFilaMessages.stageLabel("en-US", "AGUARDANDO"));
        org.junit.jupiter.api.Assertions.assertEquals("En ejecución", CapacidadeFilaMessages.stageLabel("es-ES", "EM_EXECUCAO"));

        var en = CapacidadeFilaMessages.queueUpdated("en-US", 42, "Waiting", "In progress", "Acme");
        assertTrue(en.title().contains("42"));
        assertTrue(en.message().toLowerCase().contains("customer"));

        var whats = CapacidadeFilaMessages.whatsAppMessage("fr-FR", 7, "En attente", "En cours", "https://x");
        assertTrue(whats.contains("7"));
        assertTrue(whats.contains("https://x"));
    }

    @Test
    void ncCapaFasePendente_localizesFourLocales() {
        var pt = InAppNotificationMessages.ncCapaFasePendente("pt-BR", "NC-2026-0001", "Fuga de torque", "Contenção");
        assertTrue(pt.title().contains("NC-2026-0001"));
        assertTrue(pt.message().contains("Contenção"));

        var en = InAppNotificationMessages.ncCapaFasePendente("en-US", "NC-2026-0001", "Torque leak", "Containment");
        assertTrue(en.title().toLowerCase().contains("capa"));

        var es = InAppNotificationMessages.ncCapaFasePendente("es-ES", "NC-2026-0001", "Fuga", "Contención");
        assertTrue(es.message().contains("NC-2026-0001"));

        var fr = InAppNotificationMessages.ncCapaFasePendente("fr-FR", "NC-2026-0001", "Fuite", "Confinement");
        assertTrue(fr.title().contains("CAPA"));
    }

    @Test
    void ticketNotifications_localizeFourLocales() {
        var pt = InAppNotificationMessages.ticketResposta("pt-BR", "T-1", "Ana", "Problema no sistema");
        assertTrue(pt.title().contains("T-1"));
        assertTrue(pt.message().contains("Ana"));

        var en = InAppNotificationMessages.ticketResposta("en-US", "T-1", "Ana", "System issue");
        assertTrue(en.title().toLowerCase().contains("ticket"));

        var resolved = InAppNotificationMessages.ticketResolvido("es-ES", "T-2", "Consulta");
        assertTrue(resolved.title().contains("T-2"));

        var waiting = InAppNotificationMessages.ticketAguardandoUsuario("fr-FR", "T-3", "Demande");
        assertTrue(waiting.message().contains("T-3") || waiting.title().contains("T-3"));
    }
}
