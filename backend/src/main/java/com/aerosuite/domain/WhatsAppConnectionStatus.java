package com.aerosuite.domain;

/**
 * Status da conexão WhatsApp do tenant com a Evolution API.
 */
public enum WhatsAppConnectionStatus {
    CONNECTED,
    DISCONNECTED,
    CONNECTING;

    public static WhatsAppConnectionStatus fromEvolutionState(String state) {
        if (state == null || state.isBlank()) {
            return DISCONNECTED;
        }
        return switch (state.trim().toLowerCase()) {
            case "open", "connected" -> CONNECTED;
            case "connecting", "qrcode", "qr" -> CONNECTING;
            default -> DISCONNECTED;
        };
    }

    public static WhatsAppConnectionStatus parse(String value) {
        if (value == null || value.isBlank()) {
            return DISCONNECTED;
        }
        try {
            return valueOf(value.trim().toUpperCase());
        } catch (IllegalArgumentException e) {
            return DISCONNECTED;
        }
    }
}
