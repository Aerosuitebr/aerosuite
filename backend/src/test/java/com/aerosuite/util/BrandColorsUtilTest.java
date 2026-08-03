package com.aerosuite.util;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class BrandColorsUtilTest {

    @Test
    void normalizeHexAddsHashAndLowercases() {
        assertEquals("#ff5500", BrandColorsUtil.normalizeHex("FF5500"));
        assertEquals("#0ea5e9", BrandColorsUtil.normalizeHex(null));
    }

    @Test
    void darkenProducesDarkerColor() {
        String darker = BrandColorsUtil.darken("#0ea5e9", 0.22);
        assertTrue(darker.startsWith("#"));
        assertTrue(!darker.equalsIgnoreCase("#0ea5e9"));
    }

    @Test
    void applyBrandPaletteReplacesDefaults() {
        String html = "<div style=\"color:#0ea5e9;background:#0284c7\"></div>";
        String out = BrandColorsUtil.applyBrandPalette(html, "#ff5500", "#cc4400");
        assertTrue(out.contains("#ff5500"));
        assertTrue(out.contains("#cc4400"));
        assertTrue(!out.contains("#0ea5e9"));
    }
}
