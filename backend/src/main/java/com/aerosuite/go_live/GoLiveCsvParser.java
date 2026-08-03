package com.aerosuite.go_live;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Parser CSV/TSV tolerante (separador {@code ;} ou {@code ,}) para o kit go-live P4.3.
 */
public final class GoLiveCsvParser {

    private GoLiveCsvParser() {}

    public static List<Map<String, String>> parseRows(String csvText) {
        if (csvText == null || csvText.isBlank()) {
            return List.of();
        }
        List<String> lines = csvText.lines()
                .map(String::trim)
                .filter(l -> !l.isEmpty())
                .toList();
        if (lines.isEmpty()) {
            return List.of();
        }
        char sep = detectSeparator(lines.get(0));
        List<String> headers = splitLine(lines.get(0), sep).stream()
                .map(GoLiveCsvParser::normalizeHeader)
                .toList();
        List<Map<String, String>> rows = new ArrayList<>();
        for (int i = 1; i < lines.size(); i++) {
            List<String> cells = splitLine(lines.get(i), sep);
            if (cells.stream().allMatch(String::isBlank)) {
                continue;
            }
            Map<String, String> row = new LinkedHashMap<>();
            for (int c = 0; c < headers.size(); c++) {
                String key = headers.get(c);
                if (key.isEmpty()) {
                    continue;
                }
                String val = c < cells.size() ? cells.get(c).trim() : "";
                row.put(key, val);
            }
            if (!row.isEmpty()) {
                rows.add(row);
            }
        }
        return rows;
    }

    static String normalizeHeader(String raw) {
        if (raw == null) {
            return "";
        }
        return raw.trim()
                .toLowerCase(Locale.ROOT)
                .replace('\ufeff', ' ')
                .replaceAll("\\s+", "_");
    }

    private static char detectSeparator(String headerLine) {
        int semi = countChar(headerLine, ';');
        int comma = countChar(headerLine, ',');
        return semi >= comma ? ';' : ',';
    }

    private static int countChar(String s, char c) {
        int n = 0;
        for (int i = 0; i < s.length(); i++) {
            if (s.charAt(i) == c) {
                n++;
            }
        }
        return n;
    }

    private static List<String> splitLine(String line, char sep) {
        List<String> out = new ArrayList<>();
        StringBuilder cur = new StringBuilder();
        boolean inQuotes = false;
        for (int i = 0; i < line.length(); i++) {
            char ch = line.charAt(i);
            if (ch == '"') {
                inQuotes = !inQuotes;
                continue;
            }
            if (ch == sep && !inQuotes) {
                out.add(stripQuotes(cur.toString()));
                cur.setLength(0);
            } else {
                cur.append(ch);
            }
        }
        out.add(stripQuotes(cur.toString()));
        return out;
    }

    private static String stripQuotes(String s) {
        String t = s == null ? "" : s.trim();
        if (t.length() >= 2 && t.startsWith("\"") && t.endsWith("\"")) {
            return t.substring(1, t.length() - 1).trim();
        }
        return t;
    }

    public static String cell(Map<String, String> row, String... keys) {
        if (row == null) {
            return null;
        }
        for (String key : keys) {
            String norm = normalizeHeader(key);
            if (row.containsKey(norm)) {
                String v = row.get(norm);
                if (v != null && !v.isBlank()) {
                    return v.trim();
                }
            }
        }
        return null;
    }
}
