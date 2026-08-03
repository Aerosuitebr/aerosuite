package com.aerosuite.p1;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class TenantFeatureCatalogTest {

    @Test
    void normalizeCodeLowercases() {
        assertEquals(
                "estoque.saida.validacaoextra",
                TenantFeatureCatalog.normalizeCode("estoque.saida.validacaoExtra"));
    }

    @Test
    void validateCodesRejectsUnknown() {
        assertThrows(IllegalArgumentException.class, () -> TenantFeatureCatalog.validateCodes(java.util.List.of("foo.bar.unknown")));
    }

    @Test
    void catalogIsNonEmpty() {
        assertFalse(TenantFeatureCatalog.all().isEmpty());
    }
}
