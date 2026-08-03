package com.aerosuite.security;

import org.mindrot.jbcrypt.BCrypt;

/**
 * Senhas internas: BCrypt ({@code $2a$...}); compatível com registos legados em texto plano.
 */
public final class PasswordCredentials {

    private PasswordCredentials() {}

    public static boolean looksBcrypt(String stored) {
        return stored != null && stored.startsWith("$2");
    }

    public static String hash(String plain) {
        return BCrypt.hashpw(plain, BCrypt.gensalt(10));
    }

    public static boolean matches(String plain, String stored) {
        if (stored == null || plain == null) {
            return false;
        }
        if (looksBcrypt(stored)) {
            try {
                return BCrypt.checkpw(plain, stored);
            } catch (IllegalArgumentException e) {
                return false;
            }
        }
        return stored.equals(plain);
    }
}
