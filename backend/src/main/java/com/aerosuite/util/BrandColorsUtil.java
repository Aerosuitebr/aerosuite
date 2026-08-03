package com.aerosuite.util;

/**
 * Paleta de marca para HTML/PDF (substitui cores padrão Aero Suite).
 */
public final class BrandColorsUtil {

    public static final String DEFAULT_PRIMARY = "#0ea5e9";
    public static final String DEFAULT_PRIMARY_DEEP = "#0284c7";

    private BrandColorsUtil() {}

    public static String normalizeHex(String hex) {
        if (hex == null || hex.isBlank()) {
            return DEFAULT_PRIMARY;
        }
        String h = hex.trim();
        if (!h.startsWith("#")) {
            h = "#" + h;
        }
        if (h.length() != 7 && h.length() != 4) {
            return DEFAULT_PRIMARY;
        }
        return h.toLowerCase(java.util.Locale.ROOT);
    }

    /** Escurece um hex #RRGGBB (factor 0–1). */
    public static String darken(String hex, double factor) {
        String n = normalizeHex(hex);
        if (n.length() == 4) {
            return DEFAULT_PRIMARY_DEEP;
        }
        int r = Integer.parseInt(n.substring(1, 3), 16);
        int g = Integer.parseInt(n.substring(3, 5), 16);
        int b = Integer.parseInt(n.substring(5, 7), 16);
        double f = Math.max(0, Math.min(1, factor));
        r = (int) Math.round(r * (1 - f));
        g = (int) Math.round(g * (1 - f));
        b = (int) Math.round(b * (1 - f));
        return String.format(java.util.Locale.ROOT, "#%02x%02x%02x", r, g, b);
    }

    public static String applyBrandPalette(String html, String primary, String primaryDeep) {
        if (html == null || html.isEmpty()) {
            return html;
        }
        String p = normalizeHex(primary);
        String d = normalizeHex(primaryDeep != null && !primaryDeep.isBlank() ? primaryDeep : darken(p, 0.22));
        if (DEFAULT_PRIMARY.equalsIgnoreCase(p) && DEFAULT_PRIMARY_DEEP.equalsIgnoreCase(d)) {
            return html;
        }
        return html
                .replace(DEFAULT_PRIMARY, p)
                .replace(DEFAULT_PRIMARY.toUpperCase(java.util.Locale.ROOT), p)
                .replace(DEFAULT_PRIMARY_DEEP, d)
                .replace(DEFAULT_PRIMARY_DEEP.toUpperCase(java.util.Locale.ROOT), d);
    }
}
