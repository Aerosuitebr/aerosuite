package com.aerosuite.integration.evolution;

/**
 * Exceção de integração com a Evolution API (rede, HTTP 4xx/5xx, parsing).
 */
public class EvolutionApiException extends RuntimeException {

    private final int httpStatus;
    private final boolean instanceDisconnected;

    public EvolutionApiException(String message) {
        this(message, 0, false);
    }

    public EvolutionApiException(String message, int httpStatus) {
        this(message, httpStatus, isDisconnectedHint(message, httpStatus));
    }

    public EvolutionApiException(String message, int httpStatus, boolean instanceDisconnected) {
        super(message);
        this.httpStatus = httpStatus;
        this.instanceDisconnected = instanceDisconnected;
    }

    public EvolutionApiException(String message, Throwable cause) {
        super(message, cause);
        this.httpStatus = 0;
        this.instanceDisconnected = false;
    }

    public int getHttpStatus() {
        return httpStatus;
    }

    public boolean isInstanceDisconnected() {
        return instanceDisconnected;
    }

    private static boolean isDisconnectedHint(String message, int httpStatus) {
        if (httpStatus == 404 || httpStatus == 409 || httpStatus == 428) {
            return true;
        }
        if (message == null) {
            return false;
        }
        String lower = message.toLowerCase();
        return lower.contains("disconnect")
                || lower.contains("not connected")
                || lower.contains("connection closed")
                || lower.contains("instance not found")
                || lower.contains("close");
    }
}
