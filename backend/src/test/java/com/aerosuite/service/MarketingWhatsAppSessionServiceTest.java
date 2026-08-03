package com.aerosuite.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MarketingWhatsAppSessionServiceTest {

    @Test
    void instanceNameIsStableAndDoesNotExposeSessionKey() {
        String key = "guest_0123456789abcdef0123456789abcdef";
        String instance = MarketingWhatsAppSessionService.instanceName(key);

        assertEquals(21, instance.length());
        assertTrue(instance.startsWith("asmkt"));
        assertTrue(!instance.contains("0123456789abcdef"));
        assertEquals(instance, MarketingWhatsAppSessionService.instanceName(key));
    }

    @Test
    void rejectsInvalidSessionKey() {
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketingWhatsAppSessionService.validateSessionKey("guest_predictable"));
    }

    @Test
    void validatesContactFields() {
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketingWhatsAppSessionService.validateContact(
                        new MarketingWhatsAppSessionService.ContactRequest("", "", "")));
        assertThrows(
                IllegalArgumentException.class,
                () -> MarketingWhatsAppSessionService.validateContact(
                        new MarketingWhatsAppSessionService.ContactRequest(
                                "Ana", "A".repeat(121), "")));
    }
}
