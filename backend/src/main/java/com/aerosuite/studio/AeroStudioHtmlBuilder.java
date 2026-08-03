package com.aerosuite.studio;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.util.HtmlToPdfConverter;

/**
 * HTML parametrizado para templates Aero Studio (OpenHTMLToPDF).
 */
public final class AeroStudioHtmlBuilder {

    private AeroStudioHtmlBuilder() {}

    public static String build(AeroStudioRenderContext ctx) {
        if (ctx.customLayout != null) {
            return AeroStudioCustomHtmlBuilder.build(ctx, ctx.customLayout);
        }
        if ("papel-timbrado".equals(ctx.templateId)
                && ctx.letterheadPresetId != null
                && !ctx.letterheadPresetId.isBlank()) {
            return AeroStudioLetterheadPresets.build(ctx.letterheadPresetId.trim(), ctx);
        }
        return switch (ctx.templateId) {
            case "cartao-visita" -> cartaoVisita(ctx);
            case "papel-timbrado" -> papelTimbrado(ctx);
            case "folder-1dobra" -> folderUmaDobra(ctx);
            case "banner-hangar" -> bannerHangar(ctx);
            default -> throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TEMPLATE_INVALID, "id", ctx.templateId));
        };
    }

    private static String cartaoVisita(AeroStudioRenderContext ctx) {
        int trimW = 90;
        int trimH = 50;
        return page(ctx, trimW, trimH, 3, () -> """
            <div class="card">
              %s
              <h1>%s</h1>
              <p class="tag">%s</p>
              <p class="contact">%s</p>
              <p class="contact">%s · %s</p>
              %s
            </div>
            """
                .formatted(
                        logoBlock(ctx, 48),
                        esc(ctx.displayName),
                        esc(ctx.tagline),
                        esc(ctx.supportEmail),
                        esc(ctx.telefone),
                        esc(ctx.siteUrl),
                        qrBlock(ctx, 56)));
    }

    private static String papelTimbrado(AeroStudioRenderContext ctx) {
        return page(ctx, 210, 297, 3, () -> """
            <div class="letterhead">
              <div class="hdr-logo-wrap">%s</div>
              <header class="hdr-row">
                <div class="hdr-text">
                  <h1>%s</h1>
                  <p class="tagline">%s</p>
                </div>
                <div class="hdr-qr">%s</div>
              </header>
              <div class="body-area"></div>
              <footer>
                <p>%s</p>
                <p>%s · %s · %s</p>
              </footer>
            </div>
            """
                .formatted(
                        logoBlock(ctx, 64),
                        esc(ctx.displayName),
                        esc(ctx.tagline),
                        qrBlock(ctx, 56),
                        esc(ctx.enderecoFormatado),
                        esc(ctx.supportEmail),
                        esc(ctx.telefone),
                        esc(ctx.siteUrl)));
    }

    private static String folderUmaDobra(AeroStudioRenderContext ctx) {
        return page(ctx, 210, 297, 3, () -> """
            <div class="folder">
              <div class="panel left">
                %s
                <h1>%s</h1>
                <p class="tag">%s</p>
                <ul class="services">%s</ul>
              </div>
              <div class="panel right">
                <h2>%s</h2>
                <p>%s</p>
                <p class="contact">%s</p>
                <p class="contact">%s · %s</p>
                %s
              </div>
            </div>
            """
                .formatted(
                        logoBlock(ctx, 72),
                        esc(ctx.displayName),
                        esc(ctx.tagline),
                        servicesListHtml(ctx.servicesText),
                        esc(ctx.displayName),
                        esc(ctx.enderecoFormatado),
                        esc(ctx.supportEmail),
                        esc(ctx.telefone),
                        esc(ctx.siteUrl),
                        qrBlock(ctx, 80)));
    }

    private static String bannerHangar(AeroStudioRenderContext ctx) {
        return page(ctx, 1000, 400, 5, () -> """
            <div class="banner">
              %s
              <div class="banner-text">
                <h1>%s</h1>
                <p>%s</p>
                <p class="services">%s</p>
              </div>
              %s
            </div>
            """
                .formatted(
                        logoBlock(ctx, 120),
                        esc(ctx.displayName),
                        esc(ctx.tagline),
                        esc(ctx.servicesText != null ? ctx.servicesText.replace("\n", " · ") : ""),
                        qrBlock(ctx, 100)));
    }

    private interface BodyBuilder {
        String build();
    }

    private static String page(
            AeroStudioRenderContext ctx, int trimW, int trimH, int bleed, BodyBuilder body) {
        int pageW = trimW + bleed * 2;
        int pageH = trimH + bleed * 2;
        String crop = ctx.includeCropMarks ? cropMarksCss() : "";
        return """
            <!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
            @page { size: %dmm %dmm; margin: 0; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, Helvetica, sans-serif; color: #111; }
            .trim {
              position: relative;
              width: %dmm; height: %dmm;
              margin: %dmm;
              padding: 4mm;
              background: #fff;
            }
            h1 { margin: 0 0 2mm; font-size: 14pt; color: %s; }
            h2 { margin: 0 0 2mm; font-size: 12pt; color: %s; }
            p { margin: 0 0 1.5mm; font-size: 9pt; line-height: 1.35; }
            .tag { color: %s; font-weight: bold; }
            .contact { color: #444; font-size: 8pt; }
            .small { font-size: 7pt; color: #666; }
            .logo img { max-height: 18mm; max-width: 40mm; }
            .qr { margin-top: 2mm; }
            .qr img { width: 14mm; height: 14mm; }
            .card { text-align: center; padding-top: 6mm; }
            .letterhead .hdr-logo-wrap {
              text-align: center; margin-bottom: 2mm;
            }
            .letterhead .hdr-logo-wrap .logo img {
              max-height: 16mm; max-width: 48mm; margin: 0 auto; display: block;
            }
            .letterhead header.hdr-row {
              display: flex; flex-direction: row; flex-wrap: nowrap; align-items: center;
              gap: 3mm; border-bottom: 2px solid %s; padding-bottom: 3mm;
            }
            .letterhead header .logo { flex: 0 0 auto; }
            .letterhead header .logo img { max-height: 14mm; max-width: 28mm; width: auto; display: block; }
            .letterhead header .hdr-text {
              flex: 1 1 auto; min-width: 0; overflow: hidden;
            }
            .letterhead header .hdr-text h1 {
              margin: 0; font-size: 13pt; line-height: 1.15; white-space: nowrap;
              overflow: hidden; text-overflow: ellipsis;
            }
            .letterhead header .hdr-text .tagline {
              margin: 0.5mm 0 0; font-size: 8pt; line-height: 1.2; color: %s;
              white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
            }
            .letterhead header .hdr-qr { flex: 0 0 auto; margin-left: auto; }
            .letterhead header .qr { margin: 0; }
            .letterhead header .qr img { width: 12mm; height: 12mm; display: block; }
            .letterhead .body-area { min-height: 180mm; margin-top: 8mm; border: 1px dashed #ddd; }
            .letterhead footer { border-top: 2px solid %s; padding-top: 2mm; font-size: 7pt; color: #555; }
            .folder { display: flex; height: 100%%; }
            .folder .panel { width: 50%%; padding: 6mm; }
            .folder .left { background: %s; color: #fff; }
            .folder .left h1, .folder .left .tag { color: #fff; }
            .folder .services { margin: 4mm 0 0; padding-left: 4mm; font-size: 8pt; }
            .folder .services li { margin-bottom: 1mm; }
            .banner { display: flex; align-items: center; justify-content: space-between; height: 100%%; padding: 8mm; background: linear-gradient(90deg, %s 0%%, %s 100%%); color: #fff; }
            .banner h1 { font-size: 36pt; color: #fff; }
            .banner p { font-size: 14pt; color: rgba(255,255,255,0.92); }
            .banner .logo img { max-height: 35mm; }
            .banner .qr img { width: 22mm; height: 22mm; }
            %s
            </style></head><body><div class="trim">%s</div></body></html>
            """
                .formatted(
                        pageW,
                        pageH,
                        trimW,
                        trimH,
                        bleed,
                        ctx.primaryColor,
                        ctx.primaryColor,
                        ctx.secondaryColor,
                        ctx.primaryColor,
                        ctx.secondaryColor,
                        ctx.secondaryColor,
                        ctx.primaryColor,
                        ctx.primaryColor,
                        ctx.secondaryColor,
                        crop,
                        body.build());
    }

    private static String cropMarksCss() {
        return """
            .trim::before, .trim::after {
              content: ''; position: absolute; border: 0.2mm solid #999;
            }
            """;
    }

    private static String logoBlock(AeroStudioRenderContext ctx, int maxH) {
        if (ctx.logoAbsoluteUrl == null || ctx.logoAbsoluteUrl.isBlank()) {
            return "";
        }
        return "<div class=\"logo\"><img src=\"" + escAttr(ctx.logoAbsoluteUrl) + "\" alt=\"logo\"/></div>";
    }

    private static String qrBlock(AeroStudioRenderContext ctx, int size) {
        if (!ctx.includeQrPortal || ctx.qrDataUri == null || ctx.qrDataUri.isBlank()) {
            return "";
        }
        return "<div class=\"qr\"><img src=\"" + escAttr(ctx.qrDataUri) + "\" alt=\"QR\"/></div>";
    }

    private static String servicesListHtml(String text) {
        if (text == null || text.isBlank()) {
            return "<li>—</li>";
        }
        StringBuilder sb = new StringBuilder();
        for (String line : text.split("\n")) {
            String t = line.trim();
            if (!t.isEmpty()) {
                sb.append("<li>").append(esc(t)).append("</li>");
            }
        }
        if (sb.isEmpty()) {
            return "<li>—</li>";
        }
        return sb.toString();
    }

    private static String esc(String s) {
        return HtmlToPdfConverter.escapeHtml(s != null ? s : "");
    }

    private static String escAttr(String s) {
        return esc(s).replace("\"", "&quot;");
    }
}
