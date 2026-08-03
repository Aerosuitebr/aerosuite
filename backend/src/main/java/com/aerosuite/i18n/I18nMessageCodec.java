package com.aerosuite.i18n;

import java.net.URLDecoder;
import java.net.URLEncoder;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.Map;

/** Codifica chaves i18n (+ parâmetros) para transporte em campos de mensagem da API. */
public final class I18nMessageCodec {

    private static final String PREFIX = "i18n:";

    private I18nMessageCodec() {}

    public static String encode(String key) {
        return PREFIX + key;
    }

    public static String encode(String key, String paramKey, String paramValue) {
        return encode(key, Map.of(paramKey, paramValue == null ? "" : paramValue));
    }

    public static String encode(String key, Map<String, String> params) {
        if (params == null || params.isEmpty()) {
            return PREFIX + key;
        }
        StringBuilder sb = new StringBuilder(PREFIX).append(key);
        for (Map.Entry<String, String> e : params.entrySet()) {
            sb.append(':')
                    .append(e.getKey())
                    .append('=')
                    .append(URLEncoder.encode(e.getValue() == null ? "" : e.getValue(), StandardCharsets.UTF_8));
        }
        return sb.toString();
    }

    public static boolean isEncoded(String value) {
        return value != null && value.startsWith(PREFIX);
    }

    public static Parsed parse(String value) {
        if (!isEncoded(value)) {
            return null;
        }
        String rest = value.substring(PREFIX.length());
        int firstColon = rest.indexOf(':');
        String key = firstColon < 0 ? rest : rest.substring(0, firstColon);
        Map<String, String> params = new LinkedHashMap<>();
        if (firstColon >= 0) {
            String paramPart = rest.substring(firstColon + 1);
            for (String segment : paramPart.split(":", -1)) {
                int eq = segment.indexOf('=');
                if (eq > 0) {
                    String pk = segment.substring(0, eq);
                    String pv =
                            URLDecoder.decode(segment.substring(eq + 1), StandardCharsets.UTF_8);
                    params.put(pk, pv);
                }
            }
        }
        return new Parsed(key, params);
    }

    public record Parsed(String key, Map<String, String> params) {}
}
