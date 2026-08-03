package com.aerosuite.studio;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.util.HtmlToPdfConverter;

import java.util.List;
import java.util.Locale;
import java.util.Set;

/**
 * Modelos fixos de papel timbrado A4 — apenas dados da empresa são dinâmicos.
 */
public final class AeroStudioLetterheadPresets {

    public static final String CORPORATE_ANGLES = "corporate-angles";
    public static final String MODERN_CORNERS = "modern-corners";
    public static final String WAVES = "waves";
    public static final String INSTITUTIONAL = "institutional";
    public static final String MINIMAL_CENTER = "minimal-center";

    private static final Set<String> VALID =
            Set.of(CORPORATE_ANGLES, MODERN_CORNERS, WAVES, INSTITUTIONAL, MINIMAL_CENTER);

    private AeroStudioLetterheadPresets() {}

    public static List<String> listIds() {
        return List.of(CORPORATE_ANGLES, MODERN_CORNERS, WAVES, INSTITUTIONAL, MINIMAL_CENTER);
    }

    public static void validate(String presetId) {
        if (presetId == null || presetId.isBlank() || !VALID.contains(presetId.trim())) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_LETTERHEAD_INVALID, "id", presetId));
        }
    }

    public static String build(String presetId, AeroStudioRenderContext ctx) {
        String id = presetId.trim();
        validate(id);
        return switch (id) {
            case CORPORATE_ANGLES -> corporateAngles(ctx);
            case MODERN_CORNERS -> modernCorners(ctx);
            case WAVES -> waves(ctx);
            case INSTITUTIONAL -> institutional(ctx);
            case MINIMAL_CENTER -> minimalCenter(ctx);
            default -> throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_LETTERHEAD_INVALID, "id", id));
        };
    }

    private static String corporateAngles(AeroStudioRenderContext ctx) {
        String p = ctx.primaryColor;
        String s = ctx.secondaryColor;
        String qr = qrHeader(ctx);
        return presetPage(
                ctx,
                """
                .corp { position:relative; height:100%%; font-family:Arial,Helvetica,sans-serif; }
                .corp .deco-tr { position:absolute; top:0; right:0; width:42mm; height:28mm;
                  border-top:3mm solid %s; border-right:3mm solid %s; }
                .corp .deco-tr .lines { position:absolute; top:6mm; right:2mm; width:32mm; }
                .corp .deco-tr .ln { height:0.6mm; margin-bottom:2mm; border-radius:1mm; }
                .corp .deco-bl { position:absolute; left:0; bottom:18mm; width:8mm; height:45mm; background:%s; }
                .corp .deco-br { position:absolute; right:0; bottom:0; width:28mm; height:22mm;
                  background:linear-gradient(135deg, %s 50%%, %s 50%%); }
                .corp .head { display:flex; align-items:flex-start; gap:4mm; padding-right:38mm; }
                .corp .head .logo img { max-height:14mm; max-width:36mm; }
                .corp .head h1 { margin:0; font-size:14pt; color:%s; text-transform:uppercase; letter-spacing:0.04em; }
                .corp .head .tag { margin:1mm 0 0; font-size:7pt; color:#666; text-transform:uppercase; }
                .corp .meta { margin-top:6mm; display:flex; justify-content:space-between; align-items:flex-start; }
                .corp .meta .left { border-left:1.2mm solid %s; padding-left:3mm; max-width:62%%; }
                .corp .meta .left .nm { font-size:11pt; font-weight:bold; color:%s; margin:0 0 1mm; }
                .corp .meta .row { font-size:7.5pt; margin:0.5mm 0; color:#333; }
                .corp .meta .row strong { color:#666; font-size:7pt; }
                .corp .meta .qr-wrap { flex-shrink:0; }
                .corp .meta .qr img { width:14mm; height:14mm; }
                .corp .body { margin-top:8mm; min-height:155mm; border:0.3mm dashed #ddd; }
                .corp .ft { position:absolute; left:0; right:0; bottom:0; }
                .corp .ft-bar { background:%s; color:#fff; padding:2.5mm 4mm; font-size:7pt; }
                .corp .ft-cols { display:flex; justify-content:space-between; gap:3mm; }
                .corp .ft-col { flex:1; }
                .corp .ft-col strong { display:block; font-size:6.5pt; opacity:0.9; margin-bottom:0.5mm; }
                """
                        .formatted(p, p, p, s, p, p, p, p, s),
                """
                <div class="corp">
                  <div class="deco-tr"><div class="lines">
                    <div class="ln" style="background:%s;width:100%%"></div>
                    <div class="ln" style="background:%s;width:85%%"></div>
                    <div class="ln" style="background:%s;width:70%%"></div>
                  </div></div>
                  <div class="deco-bl"></div>
                  <div class="deco-br"></div>
                  <header class="head">
                    %s
                    <div><h1>%s</h1><p class="tag">%s</p></div>
                  </header>
                  <div class="meta">
                    <div class="left">
                      <p class="nm">%s</p>
                      <p class="row"><strong>EMAIL:</strong> %s</p>
                      <p class="row"><strong>PHONE:</strong> %s</p>
                      <p class="row"><strong>ADD:</strong> %s</p>
                      <p class="row"><strong>WEB:</strong> %s</p>
                    </div>
                    %s
                  </div>
                  <div class="body"></div>
                  <footer class="ft">
                    <div class="ft-bar">
                      <div class="ft-cols">
                        <div class="ft-col"><strong>PHONE</strong>%s</div>
                        <div class="ft-col"><strong>WEB / EMAIL</strong>%s · %s</div>
                        <div class="ft-col"><strong>ADDRESS</strong>%s</div>
                      </div>
                    </div>
                  </footer>
                </div>
                """
                        .formatted(
                                s,
                                p,
                                "#888",
                                logoBlock(ctx),
                                esc(ctx.displayName),
                                esc(ctx.tagline),
                                esc(ctx.displayName),
                                esc(ctx.supportEmail),
                                esc(ctx.telefone),
                                esc(ctx.enderecoFormatado),
                                esc(ctx.siteUrl),
                                qr,
                                esc(ctx.telefone),
                                esc(ctx.siteUrl),
                                esc(ctx.supportEmail),
                                esc(ctx.enderecoFormatado)));
    }

    private static String modernCorners(AeroStudioRenderContext ctx) {
        String p = ctx.primaryColor;
        String s = ctx.secondaryColor;
        String qr = qrHeader(ctx);
        return presetPage(
                ctx,
                """
                .mod { position:relative; height:100%%; font-family:Arial,Helvetica,sans-serif; }
                .mod .corner-tl { position:absolute; top:0; left:0; width:22mm; height:22mm;
                  background:linear-gradient(135deg, %s 0%%, %s 45%%, transparent 46%%); }
                .mod .corner-br { position:absolute; bottom:16mm; right:0; width:22mm; height:22mm;
                  background:linear-gradient(-45deg, %s 0%%, %s 45%%, transparent 46%%); }
                .mod .head { display:flex; justify-content:flex-end; align-items:center; gap:4mm; padding-top:2mm; }
                .mod .head .logo img { max-height:12mm; max-width:32mm; }
                .mod .head .tx { text-align:right; }
                .mod .head h1 { margin:0; font-size:13pt; color:%s; }
                .mod .head .tag { margin:0.5mm 0 0; font-size:8pt; color:#666; }
                .mod .contact { margin-top:8mm; font-size:8pt; line-height:1.45; color:#333; }
                .mod .contact strong { color:%s; }
                .mod .body { margin-top:6mm; min-height:158mm; border:0.3mm dashed #e2e8f0; }
                .mod .foot { position:absolute; left:0; right:0; bottom:0; border-top:0.4mm solid #e2e8f0;
                  padding-top:2mm; display:flex; justify-content:space-between; gap:2mm; font-size:7pt; color:#444; }
                .mod .foot .col { flex:1; padding:0 2mm; border-right:0.3mm solid %s; }
                .mod .foot .col:last-child { border-right:none; }
                .mod .foot .lbl { font-weight:bold; color:%s; font-size:6.5pt; display:block; margin-bottom:0.5mm; }
                .mod .qr-row { margin-top:3mm; text-align:right; }
                .mod .qr-row img { width:12mm; height:12mm; }
                """
                        .formatted(p, s, p, s, p, p, p, p),
                """
                <div class="mod">
                  <div class="corner-tl"></div>
                  <div class="corner-br"></div>
                  <header class="head">
                    %s
                    <div class="tx"><h1>%s</h1><p class="tag">%s</p></div>
                  </header>
                  <div class="contact">
                    <strong>%s</strong><br/>
                    %s<br/>
                    <strong>E:</strong> %s &nbsp; <strong>P:</strong> %s<br/>
                    <strong>A:</strong> %s
                  </div>
                  %s
                  <div class="body"></div>
                  <footer class="foot">
                    <div class="col"><span class="lbl">PHONE</span>%s</div>
                    <div class="col"><span class="lbl">WEB / EMAIL</span>%s<br/>%s</div>
                    <div class="col"><span class="lbl">ADDRESS</span>%s</div>
                  </footer>
                </div>
                """
                        .formatted(
                                logoBlock(ctx),
                                esc(ctx.displayName),
                                esc(ctx.tagline),
                                esc(ctx.displayName),
                                esc(ctx.tagline),
                                esc(ctx.supportEmail),
                                esc(ctx.telefone),
                                esc(ctx.enderecoFormatado),
                                qr.isEmpty() ? "" : "<div class=\"qr-row\">" + qrBlock(ctx) + "</div>",
                                esc(ctx.telefone),
                                esc(ctx.siteUrl),
                                esc(ctx.supportEmail),
                                esc(ctx.enderecoFormatado)));
    }

    private static String waves(AeroStudioRenderContext ctx) {
        String p = ctx.primaryColor;
        String s = ctx.secondaryColor;
        return presetPage(
                ctx,
                """
                .wv { position:relative; height:100%%; font-family:Arial,Helvetica,sans-serif; }
                .wv .wave-top { position:absolute; top:0; left:0; right:0; height:18mm;
                  background:linear-gradient(180deg, %s 0%%, %s 55%%, transparent 100%%); border-radius:0 0 50%% 50%% / 0 0 8mm 8mm; }
                .wv .wave-bot { position:absolute; bottom:0; left:0; right:0; height:20mm;
                  background:linear-gradient(0deg, %s 0%%, %s 50%%, transparent 100%%); border-radius:50%% 50%% 0 0 / 8mm 8mm 0 0; }
                .wv .content { position:relative; padding-top:14mm; padding-bottom:22mm; height:100%%; }
                .wv .body { min-height:175mm; border:0.3mm dashed #ddd; margin-top:4mm; }
                .wv .contact { position:absolute; left:4mm; bottom:22mm; max-width:75mm; }
                .wv .contact .logo img { max-height:10mm; margin-bottom:2mm; }
                .wv .contact .nm { font-size:12pt; color:%s; margin:0 0 1mm; font-weight:bold; }
                .wv .contact .tag { font-size:8pt; color:%s; margin:0 0 3mm; }
                .wv .contact .row { font-size:7.5pt; margin:1mm 0; color:#333; padding-left:4mm;
                  border-left:1mm solid %s; }
                """
                        .formatted(p, s, s, p, p, s, p),
                """
                <div class="wv">
                  <div class="wave-top"></div>
                  <div class="wave-bot"></div>
                  <div class="content">
                    <div class="body"></div>
                    <div class="contact">
                      %s
                      <p class="nm">%s</p>
                      <p class="tag">%s</p>
                      <p class="row">%s</p>
                      <p class="row">%s</p>
                      <p class="row">%s · %s</p>
                    </div>
                  </div>
                </div>
                """
                        .formatted(
                                logoBlock(ctx),
                                esc(ctx.displayName),
                                esc(ctx.tagline),
                                esc(ctx.enderecoFormatado),
                                esc(ctx.telefone),
                                esc(ctx.supportEmail),
                                esc(ctx.siteUrl)));
    }

    private static String institutional(AeroStudioRenderContext ctx) {
        String p = ctx.primaryColor;
        String qr = qrHeader(ctx);
        return presetPage(
                ctx,
                """
                .inst { height:100%%; font-family:Arial,Helvetica,sans-serif; color:#111; }
                .inst .head { display:flex; align-items:center; gap:4mm; border-bottom:0.5mm solid #333; padding-bottom:3mm; }
                .inst .head .logo img { max-height:16mm; max-width:28mm; }
                .inst .head .tx h1 { margin:0; font-size:12pt; font-weight:bold; text-transform:uppercase; }
                .inst .head .tx .sub { font-size:7.5pt; color:#444; margin:0.5mm 0 0; }
                .inst .ref { margin-top:5mm; display:flex; justify-content:space-between; font-size:8pt; }
                .inst .ref .doc { font-weight:bold; }
                .inst .block { margin-top:6mm; font-size:8.5pt; line-height:1.4; }
                .inst .block p { margin:0 0 2mm; }
                .inst .body { margin-top:8mm; min-height:150mm; border:0.3mm dashed #ccc; }
                .inst .sign { margin-top:8mm; text-align:center; font-size:8pt; }
                .inst .sign .line { width:50mm; border-top:0.3mm solid #333; margin:12mm auto 2mm; }
                .inst .foot { margin-top:6mm; text-align:center; font-size:6.5pt; color:#555; border-top:0.3mm solid #ddd; padding-top:2mm; }
                .inst .qr-side { float:right; margin-left:3mm; }
                .inst .qr-side img { width:12mm; height:12mm; }
                """
                        .formatted(),
                """
                <div class="inst">
                  <header class="head">
                    %s
                    <div class="tx">
                      <h1>%s</h1>
                      <p class="sub">%s</p>
                    </div>
                  </header>
                  <div class="ref">
                    <span class="doc">%s</span>
                    %s
                  </div>
                  <div class="block">
                    <p><strong>%s</strong></p>
                    <p>%s</p>
                    <p>%s · %s · %s</p>
                  </div>
                  <div class="body"></div>
                  <div class="sign">
                    <div class="line"></div>
                    <p><strong>%s</strong></p>
                    <p>%s</p>
                  </div>
                  <footer class="foot">%s</footer>
                </div>
                """
                        .formatted(
                                logoBlock(ctx),
                                esc(ctx.displayName),
                                esc(ctx.tagline),
                                esc(ctx.displayName),
                                qr,
                                esc(ctx.displayName),
                                esc(ctx.tagline),
                                esc(ctx.enderecoFormatado),
                                esc(ctx.supportEmail),
                                esc(ctx.telefone),
                                esc(ctx.siteUrl),
                                esc(ctx.displayName),
                                esc(ctx.tagline),
                                footLine(ctx)));
    }

    private static String minimalCenter(AeroStudioRenderContext ctx) {
        String p = ctx.primaryColor;
        return presetPage(
                ctx,
                """
                .min { height:100%%; font-family:Arial,Helvetica,sans-serif; text-align:center; position:relative; }
                .min .frame { border:0.5mm solid #111; position:absolute; inset:3mm; pointer-events:none; }
                .min .hdr { padding-top:18mm; }
                .min .logo img { max-height:14mm; max-width:40mm; margin-bottom:3mm; }
                .min .init { font-size:28pt; font-weight:bold; color:#111; margin:0; letter-spacing:0.08em; }
                .min .nm { font-size:11pt; letter-spacing:0.25em; text-transform:uppercase; margin:3mm 0 1mm; color:#111; }
                .min .tag { font-size:8pt; letter-spacing:0.35em; text-transform:uppercase; color:#666; margin:0; }
                .min .body { margin:12mm 8mm; min-height:155mm; border:0.3mm dashed #ddd; }
                .min .ft { position:absolute; left:0; right:0; bottom:10mm; font-size:7pt; color:#333; line-height:1.5; }
                """
                        .formatted(),
                """
                <div class="min">
                  <div class="frame"></div>
                  <header class="hdr">
                    %s
                    <p class="init">%s</p>
                    <p class="nm">%s</p>
                    <p class="tag">%s</p>
                  </header>
                  <div class="body"></div>
                  <footer class="ft">
                    <p>T: %s</p>
                    <p>%s</p>
                    <p>%s | %s</p>
                  </footer>
                </div>
                """
                        .formatted(
                                logoBlock(ctx),
                                esc(initials(ctx.displayName)),
                                esc(ctx.displayName),
                                esc(ctx.tagline),
                                esc(ctx.telefone),
                                esc(ctx.enderecoFormatado),
                                esc(ctx.supportEmail),
                                esc(ctx.siteUrl)));
    }

    private static String footLine(AeroStudioRenderContext ctx) {
        return esc(ctx.enderecoFormatado)
                + " — "
                + esc(ctx.telefone)
                + " — "
                + esc(ctx.siteUrl)
                + " — "
                + esc(ctx.supportEmail);
    }

    private static String initials(String name) {
        if (name == null || name.isBlank()) {
            return "—";
        }
        String[] parts = name.trim().split("\\s+");
        if (parts.length == 1) {
            String w = parts[0];
            return w.substring(0, Math.min(2, w.length())).toUpperCase(Locale.ROOT);
        }
        return ("" + parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase(Locale.ROOT);
    }

    private static String qrHeader(AeroStudioRenderContext ctx) {
        if (!ctx.includeQrPortal) {
            return "";
        }
        String block = qrBlock(ctx);
        if (block.isEmpty()) {
            return "";
        }
        return "<div class=\"qr-wrap\">" + block + "</div>";
    }

    private static String presetPage(AeroStudioRenderContext ctx, String extraCss, String bodyHtml) {
        int trimW = 210;
        int trimH = 297;
        int bleed = 3;
        int pageW = trimW + bleed * 2;
        int pageH = trimH + bleed * 2;
        String crop = ctx.includeCropMarks ? cropMarksCss() : "";
        return """
            <!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
            @page { size: %dmm %dmm; margin: 0; }
            * { box-sizing: border-box; }
            body { margin: 0; }
            .trim { position: relative; width: %dmm; height: %dmm; margin: %dmm; padding: 0; background: #fff; }
            .logo img { max-width: 100%%; object-fit: contain; }
            %s
            %s
            </style></head><body><div class="trim">%s</div></body></html>
            """
                .formatted(pageW, pageH, trimW, trimH, bleed, extraCss, crop, bodyHtml)
                .replace("<div", "<div")
                .replace("</div>", "</div>")
                .replace("</div>", "</div>");
    }

    private static String cropMarksCss() {
        return """
            .trim::before, .trim::after {
              content: ''; position: absolute; border: 0.2mm solid #999;
            }
            """;
    }

    private static String logoBlock(AeroStudioRenderContext ctx) {
        if (ctx.logoAbsoluteUrl == null || ctx.logoAbsoluteUrl.isBlank()) {
            return "";
        }
        return "<div class=\"logo\"><img src=\"" + escAttr(ctx.logoAbsoluteUrl) + "\" alt=\"logo\"/></div>";
    }

    private static String qrBlock(AeroStudioRenderContext ctx) {
        if (!ctx.includeQrPortal || ctx.qrDataUri == null || ctx.qrDataUri.isBlank()) {
            return "";
        }
        return "<div class=\"qr\"><img src=\"" + escAttr(ctx.qrDataUri) + "\" alt=\"QR\"/></div>";
    }

    private static String esc(String s) {
        return HtmlToPdfConverter.escapeHtml(s != null ? s : "");
    }

    private static String escAttr(String s) {
        return esc(s).replace("\"", "&quot;");
    }
}
