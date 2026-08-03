package com.aerosuite.security;

import com.aerosuite.i18n.ApiI18nMessages;

/**
 * Política de senha para criação/troca (não se aplica ao login com senhas legadas).
 */
public final class PasswordPolicyValidator {

    public static final int MIN_LENGTH = 8;
    /** Sequências numéricas asc/desc com mais que este tamanho são rejeitadas (ex.: 1234). */
    public static final int MAX_DIGIT_SEQUENCE = 3;

    private PasswordPolicyValidator() {}

    public static boolean isValid(String password) {
        if (password == null || password.length() < MIN_LENGTH) {
            return false;
        }
        if (!hasUppercase(password)) {
            return false;
        }
        if (!hasLowercase(password)) {
            return false;
        }
        if (!hasDigit(password)) {
            return false;
        }
        if (!hasSpecial(password)) {
            return false;
        }
        return !hasLongDigitSequence(password);
    }

    public static void requireValid(String password) {
        if (!isValid(password)) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_POLICY));
        }
    }

    public static void requireValidRuntime(String password) {
        if (!isValid(password)) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.AUTH_PASSWORD_POLICY));
        }
    }

    static boolean hasUppercase(String password) {
        for (int i = 0; i < password.length(); i++) {
            if (Character.isUpperCase(password.charAt(i))) {
                return true;
            }
        }
        return false;
    }

    static boolean hasLowercase(String password) {
        for (int i = 0; i < password.length(); i++) {
            if (Character.isLowerCase(password.charAt(i))) {
                return true;
            }
        }
        return false;
    }

    static boolean hasDigit(String password) {
        for (int i = 0; i < password.length(); i++) {
            if (Character.isDigit(password.charAt(i))) {
                return true;
            }
        }
        return false;
    }

    static boolean hasSpecial(String password) {
        for (int i = 0; i < password.length(); i++) {
            char c = password.charAt(i);
            if (!Character.isLetterOrDigit(c)) {
                return true;
            }
        }
        return false;
    }

    static boolean hasLongDigitSequence(String password) {
        int ascending = 1;
        int descending = 1;
        Integer prevDigit = null;

        for (int i = 0; i < password.length(); i++) {
            char c = password.charAt(i);
            if (!Character.isDigit(c)) {
                ascending = 1;
                descending = 1;
                prevDigit = null;
                continue;
            }
            int d = c - '0';
            if (prevDigit != null) {
                if (d == prevDigit + 1) {
                    ascending++;
                    descending = 1;
                } else if (d == prevDigit - 1) {
                    descending++;
                    ascending = 1;
                } else {
                    ascending = 1;
                    descending = 1;
                }
                if (ascending > MAX_DIGIT_SEQUENCE || descending > MAX_DIGIT_SEQUENCE) {
                    return true;
                }
            }
            prevDigit = d;
        }
        return false;
    }
}
