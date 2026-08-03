package com.aerosuite.security;

import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.nio.ByteBuffer;
import java.security.SecureRandom;
import java.time.Instant;

/**
 * TOTP RFC 6238 (SHA-1, 30s, 6 dígitos) — compatível com Google Authenticator / Authy.
 */
public final class TotpService {

    private static final int SECRET_BYTES = 20;
    private static final int TIME_STEP_SEC = 30;
    private static final int CODE_DIGITS = 6;
    private static final int WINDOW_STEPS = 1;
    private static final SecureRandom RANDOM = new SecureRandom();

    private TotpService() {}

    public static String generateSecretBase32() {
        byte[] bytes = new byte[SECRET_BYTES];
        RANDOM.nextBytes(bytes);
        return encodeBase32(bytes);
    }

    public static boolean verify(String secretBase32, String code) {
        if (secretBase32 == null || secretBase32.isBlank() || code == null) {
            return false;
        }
        String normalized = code.replaceAll("\\s+", "");
        if (!normalized.matches("\\d{6}")) {
            return false;
        }
        byte[] key = decodeBase32(secretBase32);
        long counter = Instant.now().getEpochSecond() / TIME_STEP_SEC;
        for (int offset = -WINDOW_STEPS; offset <= WINDOW_STEPS; offset++) {
            String expected = hotp(key, counter + offset);
            if (expected.equals(normalized)) {
                return true;
            }
        }
        return false;
    }

    public static String buildOtpAuthUri(String issuer, String account, String secretBase32) {
        String safeIssuer = issuer != null ? issuer.replace(':', ' ') : "Aero Suite";
        String safeAccount = account != null ? account : "user";
        return "otpauth://totp/"
                + urlEncode(safeIssuer + ":" + safeAccount)
                + "?secret=" + secretBase32
                + "&issuer=" + urlEncode(safeIssuer)
                + "&algorithm=SHA1&digits=6&period=30";
    }

    static String hotp(byte[] key, long counter) {
        try {
            Mac mac = Mac.getInstance("HmacSHA1");
            mac.init(new SecretKeySpec(key, "HmacSHA1"));
            byte[] hash = mac.doFinal(ByteBuffer.allocate(8).putLong(counter).array());
            int offset = hash[hash.length - 1] & 0x0f;
            int binary = ((hash[offset] & 0x7f) << 24)
                    | ((hash[offset + 1] & 0xff) << 16)
                    | ((hash[offset + 2] & 0xff) << 8)
                    | (hash[offset + 3] & 0xff);
            int otp = binary % (int) Math.pow(10, CODE_DIGITS);
            return String.format("%0" + CODE_DIGITS + "d", otp);
        } catch (Exception e) {
            throw new IllegalStateException("Falha ao calcular TOTP", e);
        }
    }

    private static String urlEncode(String value) {
        return java.net.URLEncoder.encode(value, java.nio.charset.StandardCharsets.UTF_8);
    }

    private static final char[] BASE32_ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567".toCharArray();

    static String encodeBase32(byte[] data) {
        StringBuilder result = new StringBuilder((data.length * 8 + 4) / 5);
        int buffer = 0;
        int bitsLeft = 0;
        for (byte b : data) {
            buffer = (buffer << 8) | (b & 0xff);
            bitsLeft += 8;
            while (bitsLeft >= 5) {
                int index = (buffer >> (bitsLeft - 5)) & 0x1f;
                bitsLeft -= 5;
                result.append(BASE32_ALPHABET[index]);
            }
        }
        if (bitsLeft > 0) {
            int index = (buffer << (5 - bitsLeft)) & 0x1f;
            result.append(BASE32_ALPHABET[index]);
        }
        return result.toString();
    }

    static byte[] decodeBase32(String encoded) {
        String normalized = encoded.replace("=", "").replace(" ", "").toUpperCase();
        ByteBuffer out = ByteBuffer.allocate(normalized.length() * 5 / 8 + 1);
        int buffer = 0;
        int bitsLeft = 0;
        for (char c : normalized.toCharArray()) {
            int val = base32Value(c);
            if (val < 0) {
                continue;
            }
            buffer = (buffer << 5) | val;
            bitsLeft += 5;
            if (bitsLeft >= 8) {
                out.put((byte) ((buffer >> (bitsLeft - 8)) & 0xff));
                bitsLeft -= 8;
            }
        }
        byte[] bytes = new byte[out.position()];
        out.flip();
        out.get(bytes);
        return bytes;
    }

    private static int base32Value(char c) {
        if (c >= 'A' && c <= 'Z') {
            return c - 'A';
        }
        if (c >= '2' && c <= '7') {
            return c - '2' + 26;
        }
        return -1;
    }
}
