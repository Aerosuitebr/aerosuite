package com.aerosuite.i18n;

/** Mapeia códigos estáveis de {@code AuthLoginException} para chaves i18n da API. */
public final class AuthI18nCodes {

    private AuthI18nCodes() {}

    public static String keyFor(String code) {
        if (code == null || code.isBlank()) {
            return ApiI18nMessages.AUTH_INVALID_CREDENTIALS;
        }
        return switch (code) {
            case "INVALID_CREDENTIALS" -> ApiI18nMessages.AUTH_INVALID_CREDENTIALS;
            case "USER_INACTIVE" -> ApiI18nMessages.AUTH_USER_INACTIVE;
            case "SUBSCRIPTION_INACTIVE" -> ApiI18nMessages.AUTH_SUBSCRIPTION_INACTIVE;
            case "TENANT_REQUIRED" -> ApiI18nMessages.AUTH_TENANT_REQUIRED;
            case "TENANT_NOT_FOUND" -> ApiI18nMessages.AUTH_TENANT_NOT_FOUND;
            case "MFA_REQUIRED" -> ApiI18nMessages.AUTH_MFA_REQUIRED;
            case "MFA_ENROLLMENT_REQUIRED" -> ApiI18nMessages.AUTH_MFA_ENROLLMENT_REQUIRED;
            case "INVALID_MFA_CODE" -> ApiI18nMessages.AUTH_MFA_CODE_INVALID;
            default -> ApiI18nMessages.AUTH_INVALID_CREDENTIALS;
        };
    }

    public static String encodedMessage(String code) {
        return ApiI18nMessages.encode(keyFor(code));
    }
}
