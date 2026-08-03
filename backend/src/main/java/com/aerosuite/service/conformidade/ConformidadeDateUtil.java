package com.aerosuite.service.conformidade;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

public final class ConformidadeDateUtil {

    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    private ConformidadeDateUtil() {}

    public static LocalDate parseDate(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        try {
            return LocalDate.parse(value.trim(), D);
        } catch (DateTimeParseException e) {
            return null;
        }
    }

    public static String formatDate(LocalDate date) {
        return date != null ? date.format(D) : null;
    }

    public static void applyAlerta(LocalDate refDate, int diasJanela, AlertaConsumer consumer) {
        if (refDate == null) {
            return;
        }
        LocalDate hoje = LocalDate.now();
        long dias = ChronoUnit.DAYS.between(hoje, refDate);
        if (refDate.isBefore(hoje)) {
            consumer.accept("VENCIDA", (int) dias);
        } else if (!refDate.isAfter(hoje.plusDays(diasJanela))) {
            consumer.accept("PROXIMA", (int) dias);
        }
    }

    @FunctionalInterface
    public interface AlertaConsumer {
        void accept(String severidade, int dias);
    }
}
