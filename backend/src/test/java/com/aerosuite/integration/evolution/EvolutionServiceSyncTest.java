package com.aerosuite.integration.evolution;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.domain.WhatsAppConnectionStatus;
import org.junit.jupiter.api.Test;

class EvolutionServiceSyncTest {

    @Test
    void doesNotDowngradeConnectedToConnecting() {
        assertFalse(EvolutionService.shouldApplySyncedStatus(
                WhatsAppConnectionStatus.CONNECTED, WhatsAppConnectionStatus.CONNECTING));
    }

    @Test
    void allowsUpgradeToConnected() {
        assertTrue(EvolutionService.shouldApplySyncedStatus(
                WhatsAppConnectionStatus.CONNECTING, WhatsAppConnectionStatus.CONNECTED));
    }

    @Test
    void allowsDisconnectFromConnected() {
        assertTrue(EvolutionService.shouldApplySyncedStatus(
                WhatsAppConnectionStatus.CONNECTED, WhatsAppConnectionStatus.DISCONNECTED));
    }
}
