package com.aerosuite.domain;

/** Modo de entrega de e-mails transacionais de chamados para o usuário solicitante. */
public final class TicketEmailModo {

    public static final String INSTANT = "INSTANT";
    public static final String DIGEST_DAILY = "DIGEST_DAILY";
    public static final String OFF = "OFF";

    private TicketEmailModo() {}

    public static String normalize(String raw) {
        if (raw == null || raw.isBlank()) {
            return INSTANT;
        }
        String v = raw.trim().toUpperCase(java.util.Locale.ROOT);
        return switch (v) {
            case DIGEST_DAILY -> DIGEST_DAILY;
            case OFF -> OFF;
            default -> INSTANT;
        };
    }
}
