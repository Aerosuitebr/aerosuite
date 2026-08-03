package com.aerosuite.i18n;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class I18nMessageCodecTest {

    @Test
    void roundTripWithParams() {
        String encoded =
                I18nMessageCodec.encode(
                        "config.update.backend.newVersion", "version", "1.2.3");
        assertTrue(I18nMessageCodec.isEncoded(encoded));
        I18nMessageCodec.Parsed parsed = I18nMessageCodec.parse(encoded);
        assertNotNull(parsed);
        assertEquals("config.update.backend.newVersion", parsed.key());
        assertEquals("1.2.3", parsed.params().get("version"));
    }

    @Test
    void plainTextNotEncoded() {
        assertFalse(I18nMessageCodec.isEncoded("Cancelada pelo usuário"));
        assertNull(I18nMessageCodec.parse("texto livre"));
    }
}
