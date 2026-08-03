package com.aerosuite.util;

import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.ws.rs.BadRequestException;

import java.util.Map;

/**
 * Valida comprimento máximo de strings antes de persistir (evita erro genérico de truncamento SQL).
 */
public final class FieldLengthValidator {

    private FieldLengthValidator() {}

    public static String trimToNull(String value) {
        if (value == null) {
            return null;
        }
        String trimmed = value.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    public static String requireMax(String value, int max, String fieldKey) {
        if (value != null && value.length() > max) {
            throw new BadRequestException(
                    ApiI18nMessages.encode(
                            ApiI18nMessages.COMMON_FIELD_TOO_LONG,
                            Map.of("field", fieldKey, "max", String.valueOf(max))));
        }
        return value;
    }

    public static String trimRequireMax(String value, int max, String fieldKey) {
        return requireMax(trimToNull(value), max, fieldKey);
    }
}
