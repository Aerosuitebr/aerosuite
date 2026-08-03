package com.aerosuite.estoque;

import com.aerosuite.domain.ItemEstoque;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class CertificadoPecaUtilTest {

    @Test
    void legacyCertificadoTextIsCompleteWithoutAnexo() {
        ItemEstoque item = new ItemEstoque();
        item.certificadoConformidade = "EASA-123";
        assertTrue(CertificadoPecaUtil.isCompleto(item, true));
    }

    @Test
    void structuredRequiresAnexoWhenFlagTrue() {
        ItemEstoque item = new ItemEstoque();
        item.certTipo = "EASA_FORM1";
        item.certNumero = "BR-99";
        assertFalse(CertificadoPecaUtil.isCompleto(item, true));
        item.certAnexoPath = "1/2/file.pdf";
        assertTrue(CertificadoPecaUtil.isCompleto(item, true));
    }
}
