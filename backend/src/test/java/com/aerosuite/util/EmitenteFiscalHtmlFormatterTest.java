package com.aerosuite.util;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class EmitenteFiscalHtmlFormatterTest {

    @Test
    void escapeHtml_stripsAngleBrackets() {
        String out = EmitenteFiscalHtmlFormatter.escapeHtml("<script>x</script>");
        assertFalse(out.contains("<"));
        assertTrue(out.contains("&lt;"));
    }

    @Test
    void buildHtml_emptyWhenOnboardingIncomplete() {
        String html = EmitenteFiscalHtmlFormatter.buildHtml(
                false,
                "ACME",
                "12",
                null,
                null,
                null,
                "Rua A",
                "1",
                null,
                null,
                "São Paulo",
                "SP",
                "01000",
                "11999999999",
                null,
                "a@b.com",
                "",
                "");
        assertTrue(html.isEmpty());
    }

    @Test
    void buildHtml_includesMunicipalAndNfeWhenPresent() {
        String html = EmitenteFiscalHtmlFormatter.buildHtml(
                true,
                "ACME LTDA",
                "12345678000199",
                "123",
                "456789",
                "nfe@acme.com.br",
                "Av. Brasil",
                "100",
                "Sala 2",
                "Centro",
                "São Paulo",
                "SP",
                "01310",
                "1133334444",
                "https://acme.com",
                "contato@acme.com.br",
                "margin:0;",
                "font-size:10px;");
        assertTrue(html.contains("ACME"));
        assertTrue(html.contains("Inscr. municipal: 456789"));
        assertTrue(html.contains("E-mail NF-e: nfe@acme.com.br"));
        assertFalse(html.contains("<script>"));
    }

    @Test
    void formatEnderecoSingleLine_joinsParts() {
        String line = EmitenteFiscalHtmlFormatter.formatEnderecoSingleLine(
                "Rua X", "10", "", "Bairro", "Campinas", "SP", "13000");
        assertTrue(line.contains("Rua X"));
        assertTrue(line.contains("Campinas/SP"));
    }
}
