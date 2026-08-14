package com.aerosuite.parts;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class InternalInventoryPartsConnectorTest {
    @Test
    void matchesIsoCodeAgainstLocalizedLegacyCountryName() {
        assertTrue(InternalInventoryPartsConnector.matchesCountry("Brasil", "BR"));
        assertTrue(InternalInventoryPartsConnector.matchesCountry("Estados Unidos", "US"));
        assertFalse(InternalInventoryPartsConnector.matchesCountry("Canadá", "BR"));
    }

    @Test
    void acceptsEmptyCountryFilter() {
        assertTrue(InternalInventoryPartsConnector.matchesCountry("Brasil", ""));
        assertTrue(InternalInventoryPartsConnector.matchesCountry("Brasil", null));
    }
}
