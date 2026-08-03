package com.aerosuite.service;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Locale;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/** Expande metadados de hero premium embutidos em templates de onboarding. */
public final class OnboardingTemplateHeroUtil {

    private static final Pattern HERO_COMMENT =
            Pattern.compile("^<!--aerosuite-hero:([A-Za-z0-9+/=_-]+)-->\\s*", Pattern.DOTALL);

    private OnboardingTemplateHeroUtil() {}

    public static String expandForSend(String bodyTemplate, Map<String, String> vars) {
        if (bodyTemplate == null || bodyTemplate.isBlank()) {
            return bodyTemplate;
        }
        Matcher m = HERO_COMMENT.matcher(bodyTemplate.trim());
        if (!m.find()) {
            return applyVars(bodyTemplate, vars);
        }
        String encoded = m.group(1);
        String contentHtml = bodyTemplate.substring(m.end());
        HeroConfig hero = decodeHero(encoded);
        if (hero == null || !hero.enabled) {
            return applyVars(contentHtml, vars);
        }
        String headline = applyVars(blankToEmpty(hero.headline), vars);
        String heroHtml = buildHeroHtml(hero.layout, hero.imageDataUrl, headline);
        return heroHtml + applyVars(contentHtml, vars);
    }

    private static HeroConfig decodeHero(String encoded) {
        try {
            byte[] jsonBytes = Base64.getDecoder().decode(encoded.replace('-', '+').replace('_', '/'));
            String json = new String(jsonBytes, StandardCharsets.UTF_8);
            HeroConfig cfg = new HeroConfig();
            cfg.enabled = json.contains("\"enabled\":true") || json.contains("\"enabled\": true");
            cfg.layout = json.contains("\"layout\":\"overlay\"") || json.contains("\"layout\": \"overlay\"")
                    ? "overlay"
                    : "classic";
            cfg.headline = extractJsonString(json, "headline");
            cfg.imageDataUrl = extractJsonString(json, "imageDataUrl");
            if ("null".equals(cfg.imageDataUrl)) {
                cfg.imageDataUrl = null;
            }
            return cfg;
        } catch (Exception ex) {
            return null;
        }
    }

    private static String extractJsonString(String json, String key) {
        String needle = "\"" + key + "\":";
        int idx = json.indexOf(needle);
        if (idx < 0) {
            return "";
        }
        int start = idx + needle.length();
        while (start < json.length() && Character.isWhitespace(json.charAt(start))) {
            start++;
        }
        if (start >= json.length()) {
            return "";
        }
        if (json.charAt(start) == '"') {
            StringBuilder sb = new StringBuilder();
            for (int i = start + 1; i < json.length(); i++) {
                char c = json.charAt(i);
                if (c == '\\' && i + 1 < json.length()) {
                    sb.append(json.charAt(++i));
                } else if (c == '"') {
                    break;
                } else {
                    sb.append(c);
                }
            }
            return sb.toString();
        }
        if (json.startsWith("null", start)) {
            return "null";
        }
        return "";
    }

    private static String buildHeroHtml(String layout, String imageDataUrl, String headline) {
        String img = !blank(imageDataUrl)
                ? esc(imageDataUrl)
                : "data:image/svg+xml;base64,"
                        + Base64.getEncoder().encodeToString(
                                ("<svg xmlns='http://www.w3.org/2000/svg' width='600' height='250'>"
                                                + "<defs><linearGradient id='g' x1='0' y1='0' x2='1' y2='1'>"
                                                + "<stop offset='0%' stop-color='#0c4a6e'/>"
                                                + "<stop offset='100%' stop-color='#0369a1'/>"
                                                + "</linearGradient></defs>"
                                                + "<rect width='600' height='250' fill='url(#g)'/></svg>")
                                        .getBytes(StandardCharsets.UTF_8));
        String safeHeadline = esc(headline);
        if ("overlay".equalsIgnoreCase(layout)) {
            return """
<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%%;margin:0 0 0;border-collapse:collapse;">
<tr><td style="padding:0;background-image:url('%s');background-size:cover;background-position:center;height:250px;position:relative;border-radius:8px 8px 0 0;overflow:hidden;">
<!--[if gte mso 9]><v:rect xmlns:v="urn:schemas-microsoft-com:vml" fill="true" stroke="false" style="width:600px;height:250px;"><v:fill type="frame" src="%s" color="#0c4a6e"/><v:textbox inset="0,0,0,0"><![endif]-->
<div style="background:rgba(15,23,42,0.52);padding:48px 32px;text-align:center;">
<div style="font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;font-size:24px;font-weight:700;line-height:1.35;color:#f8fafc;letter-spacing:-0.02em;">%s</div>
</div>
<!--[if gte mso 9]></v:textbox></v:rect><![endif]-->
</td></tr></table>
"""
                    .formatted(img, img, safeHeadline);
        }
        return """
<table role="presentation" width="100%%" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%%;margin:0 0 0;border-collapse:collapse;">
<tr><td style="padding:0;line-height:0;font-size:0;">
<img src="%s" alt="" width="600" style="display:block;width:100%%;max-width:600px;height:auto;border:0;border-radius:8px 8px 0 0;"/>
</td></tr>
<tr><td style="background:#0c1929;padding:28px 32px;text-align:center;border-radius:0 0 8px 8px;">
<div style="font-family:system-ui,-apple-system,'Segoe UI',Arial,sans-serif;font-size:22px;font-weight:700;line-height:1.35;color:#f8fafc;letter-spacing:0.02em;">%s</div>
</td></tr></table>
"""
                .formatted(img, safeHeadline);
    }

    private static String applyVars(String template, Map<String, String> vars) {
        if (template == null) {
            return "";
        }
        if (vars == null || vars.isEmpty()) {
            return template;
        }
        String result = template;
        for (Map.Entry<String, String> e : vars.entrySet()) {
            result = result.replace("{{" + e.getKey() + "}}", e.getValue() != null ? e.getValue() : "");
        }
        return result;
    }

    private static String esc(String value) {
        if (value == null) {
            return "";
        }
        return value
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    private static boolean blank(String value) {
        return value == null || value.trim().isEmpty();
    }

    private static String blankToEmpty(String value) {
        return value == null ? "" : value;
    }

    private static final class HeroConfig {
        boolean enabled;
        String layout = "classic";
        String headline = "";
        String imageDataUrl;
    }
}
