package com.aerosuite.security;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.time.LocalDateTime;
import java.util.HexFormat;

/** Integridade de assinatura job card (REQ-008): SHA-256 + carimbo server-side. */
public final class JobCardAssinaturaIntegrity {

    private JobCardAssinaturaIntegrity() {}

    public static String sha256Hex(byte[] pngBytes) {
        if (pngBytes == null || pngBytes.length == 0) {
            return null;
        }
        try {
            MessageDigest md = MessageDigest.getInstance("SHA-256");
            return HexFormat.of().formatHex(md.digest(pngBytes));
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao calcular SHA-256 da assinatura", e);
        }
    }

    public static LocalDateTime serverTimestamp() {
        return LocalDateTime.now();
    }

    /**
     * @return {@code true} se o hash confere, {@code false} se diverge, {@code null} se legado sem hash gravado
     */
    public static Boolean verify(byte[] pngBytes, String storedSha256) {
        if (pngBytes == null || pngBytes.length == 0) {
            return storedSha256 == null || storedSha256.isBlank();
        }
        if (storedSha256 == null || storedSha256.isBlank()) {
            return null;
        }
        String computed = sha256Hex(pngBytes);
        return computed != null && computed.equalsIgnoreCase(storedSha256.trim());
    }
}
