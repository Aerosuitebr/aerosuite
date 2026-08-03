package com.aerosuite.json;

import com.fasterxml.jackson.core.JsonParser;
import com.fasterxml.jackson.databind.DeserializationContext;
import com.fasterxml.jackson.databind.JsonDeserializer;
import com.fasterxml.jackson.databind.JsonMappingException;

import java.io.IOException;
import java.time.Instant;
import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.time.ZoneId;
import java.time.ZonedDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Aceita vários formatos de data/hora vindos do frontend (ex.: cotação BCB / OData)
 * que não batem com o padrão estrito de {@link LocalDateTime} do Jackson.
 */
public class LenientLocalDateTimeDeserializer extends JsonDeserializer<LocalDateTime> {

    private static final ZoneId BR = ZoneId.of("America/Sao_Paulo");
    private static final Pattern MS_DATE = Pattern.compile("^/Date\\((-?\\d+)(?:[+-]\\d{4})?\\)/$");

    @Override
    public LocalDateTime deserialize(JsonParser p, DeserializationContext ctxt) throws IOException {
        if (p.currentToken() == null) {
            return null;
        }
        if (p.currentToken().isNumeric()) {
            long v = p.getLongValue();
            // Heurística: ms desde 1970 (BCB OData /Date(ms)/ às vezes vira número em alguns clientes)
            if (v > 1_000_000_000_000L) {
                return LocalDateTime.ofInstant(Instant.ofEpochMilli(v), BR);
            }
            return LocalDateTime.ofInstant(Instant.ofEpochSecond(v), BR);
        }
        String raw = p.getValueAsString();
        if (raw == null || raw.isBlank()) {
            return null;
        }
        String s = raw.trim();

        Matcher m = MS_DATE.matcher(s);
        if (m.matches()) {
            long millis = Long.parseLong(m.group(1));
            return LocalDateTime.ofInstant(Instant.ofEpochMilli(millis), BR);
        }

        // BCB costuma devolver "yyyy-MM-dd HH:mm:ss.SSS UTC"
        if (s.endsWith(" UTC")) {
            String core = s.substring(0, s.length() - 4).trim();
            LocalDateTime parsed = tryPatterns(core,
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"),
                    DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
            if (parsed != null) {
                return parsed;
            }
        }

        LocalDateTime fromOffset = tryOffset(s);
        if (fromOffset != null) {
            return fromOffset;
        }

        try {
            return Instant.parse(s).atZone(BR).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
            // segue
        }

        LocalDateTime iso = tryPatterns(s,
                DateTimeFormatter.ISO_LOCAL_DATE_TIME,
                DateTimeFormatter.ofPattern("yyyy-MM-dd'T'HH:mm:ss.SSS"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss.SSS"),
                DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        if (iso != null) {
            return iso;
        }

        String spaced = s.replace(' ', 'T');
        fromOffset = tryOffset(spaced);
        if (fromOffset != null) {
            return fromOffset;
        }

        try {
            return LocalDateTime.parse(spaced);
        } catch (DateTimeParseException e) {
            throw JsonMappingException.from(p, "Não foi possível interpretar data/hora: " + raw);
        }
    }

    private static LocalDateTime tryOffset(String s) {
        try {
            return OffsetDateTime.parse(s).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
        }
        try {
            return ZonedDateTime.parse(s).toLocalDateTime();
        } catch (DateTimeParseException ignored) {
        }
        return null;
    }

    private static LocalDateTime tryPatterns(String s, DateTimeFormatter... formatters) {
        for (DateTimeFormatter f : formatters) {
            try {
                return LocalDateTime.parse(s, f);
            } catch (DateTimeParseException ignored) {
            }
        }
        return null;
    }
}
