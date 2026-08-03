package com.aerosuite.domain;

import static org.junit.jupiter.api.Assertions.assertEquals;

import org.junit.jupiter.api.Test;

class WhatsAppConnectionStatusTest {

    @Test
    void fromEvolutionStateMapsOpenToConnected() {
        assertEquals(WhatsAppConnectionStatus.CONNECTED, WhatsAppConnectionStatus.fromEvolutionState("open"));
        assertEquals(WhatsAppConnectionStatus.CONNECTED, WhatsAppConnectionStatus.fromEvolutionState("connected"));
    }

    @Test
    void fromEvolutionStateMapsConnecting() {
        assertEquals(WhatsAppConnectionStatus.CONNECTING, WhatsAppConnectionStatus.fromEvolutionState("connecting"));
    }

    @Test
    void fromEvolutionStateMapsCloseToDisconnected() {
        assertEquals(WhatsAppConnectionStatus.DISCONNECTED, WhatsAppConnectionStatus.fromEvolutionState("close"));
        assertEquals(WhatsAppConnectionStatus.DISCONNECTED, WhatsAppConnectionStatus.fromEvolutionState(""));
    }
}
