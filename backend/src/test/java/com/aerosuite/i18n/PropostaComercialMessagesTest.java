package com.aerosuite.i18n;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class PropostaComercialMessagesTest {

    @Test
    void whatsApp_english_usesLocalizedGreeting() {
        PropostaComercialMessages.WhatsAppTexts w =
                PropostaComercialMessages.whatsApp(PropostaComercialMessages.Lang.EN);
        assertTrue(w.greeting().startsWith("Hello!"));
        assertEquals("Proposal:", w.propostaLabel());
        assertTrue(w.apiAttachHint().contains("attached"));
    }

    @Test
    void osBridge_obsIniServ_portugueseByDefault() {
        com.aerosuite.domain.PropostaComercial p = new com.aerosuite.domain.PropostaComercial();
        p.numeroProposta = "PROP-1";
        p.servicoExecutado = "Inspeção";

        String obs = PropostaOsBridgeMessages.buildObsIniServ(p, java.util.List.of(), "pt-BR");
        assertTrue(obs.contains("Origem: proposta comercial"));
        assertTrue(obs.contains("Serviço:"));
    }

    @Test
    void osBridge_obsIniServ_englishLocale() {
        com.aerosuite.domain.PropostaComercial p = new com.aerosuite.domain.PropostaComercial();
        p.numeroProposta = "PROP-2";

        String obs = PropostaOsBridgeMessages.buildObsIniServ(p, java.util.List.of(), "en-US");
        assertTrue(obs.contains("Source: commercial proposal"));
    }
}
