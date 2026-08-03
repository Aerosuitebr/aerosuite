package com.aerosuite.studio;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.dto.studio.AeroStudioCanvasElementDto;
import com.aerosuite.dto.studio.AeroStudioCanvasLayoutDto;
import com.aerosuite.util.HtmlToPdfConverter;

import java.util.Comparator;
import java.util.List;

/**
 * Converte layout livre (editor) em HTML para OpenHTMLToPDF.
 */
public final class AeroStudioCustomHtmlBuilder {

    private static final int MAX_ELEMENTS = 120;

    private AeroStudioCustomHtmlBuilder() {}

    public static String build(AeroStudioRenderContext ctx, AeroStudioCanvasLayoutDto layout) {
        return build(ctx, layout, null, false);
    }

    public static String buildAnimatedPreview(AeroStudioRenderContext ctx, AeroStudioCanvasLayoutDto layout) {
        return build(ctx, layout, null, true);
    }

    public static String build(
            AeroStudioRenderContext ctx,
            AeroStudioCanvasLayoutDto layout,
            Double animationCaptureSec,
            boolean loopAnimations) {
        if (layout == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_CUSTOM_LAYOUT_REQUIRED));
        }
        int trimW = clamp(layout.widthMm, 10, 3000);
        int trimH = clamp(layout.heightMm, 10, 3000);
        int bleed = clamp(layout.bleedMm, 0, 20);
        String bg = safeColor(layout.backgroundColor, "#ffffff");

        List<AeroStudioCanvasElementDto> elements = layout.elements != null ? layout.elements : List.of();
        if (elements.size() > MAX_ELEMENTS) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_TOO_MANY_ELEMENTS, "max", String.valueOf(MAX_ELEMENTS)));
        }

        Double capture = animationCaptureSec != null ? animationCaptureSec : ctx.animationCaptureSec;

        StringBuilder body = new StringBuilder();
        body.append("<div class=\"custom-canvas\" style=\"background:").append(bg).append(";\">");
        elements.stream()
                .sorted(Comparator.comparingInt(e -> e.zIndex))
                .forEach(el -> body.append(elementHtml(ctx, el, capture)));
        body.append("</div>");

        return page(ctx, trimW, trimH, bleed, body.toString(), loopAnimations);
    }

    private static String elementHtml(AeroStudioRenderContext ctx, AeroStudioCanvasElementDto el, Double captureSec) {
        if (el == null || el.type == null) {
            return "";
        }
        String type = el.type.trim().toLowerCase();
        if ("circle".equals(type)) {
            type = "shape";
            if (el.shapeKind == null || el.shapeKind.isBlank()) {
                el.shapeKind = "circle";
            }
        } else if ("line".equals(type)) {
            type = "shape";
            if (el.shapeKind == null || el.shapeKind.isBlank()) {
                el.shapeKind = "line";
            }
        }

        double x = clampD(el.x, 0, 5000);
        double y = clampD(el.y, 0, 5000);
        double w = clampD(el.width, 1, 5000);
        double h = clampD(el.height, 1, 5000);
        int rot = el.rotation != null ? el.rotation : 0;
        String fx = AeroStudioCanvasStyleUtil.filterCss(el.filter);
        String anim = AeroStudioCanvasStyleUtil.animationCss(el, captureSec);
        String baseStyle =
                "position:absolute;left:%.2fmm;top:%.2fmm;width:%.2fmm;height:%.2fmm;z-index:%d;%s%s"
                        .formatted(x, y, w, h, el.zIndex, fx, anim);
        if (rot != 0) {
            baseStyle += "transform:rotate(" + rot + "deg);transform-origin:center center;";
        }

        return switch (type) {
            case "text" -> textEl(el, baseStyle);
            case "shape" -> shapeEl(el, baseStyle);
            case "icon" -> iconEl(el, baseStyle);
            case "logo" -> imageEl(ctx.logoAbsoluteUrl, baseStyle, "logo");
            case "qr" -> imageEl(ctx.includeQrPortal ? ctx.qrDataUri : null, baseStyle, "QR");
            case "image" -> imageEl(el.imageUrl, baseStyle, "");
            default -> "";
        };
    }

    private static String textEl(AeroStudioCanvasElementDto el, String baseStyle) {
        double pt = el.fontSizePt != null && el.fontSizePt > 4 ? el.fontSizePt : 11;
        String color = safeColor(el.color, "#111111");
        String align = safeAlign(el.textAlign);
        String weight = "bold".equalsIgnoreCase(el.fontWeight) ? "bold" : "normal";
        String text = el.text != null ? el.text : "";
        return "<div class=\"el text\" style=\""
                + baseStyle
                + "font-size:"
                + pt
                + "pt;font-weight:"
                + weight
                + ";color:"
                + color
                + ";text-align:"
                + align
                + ";display:flex;align-items:center;overflow:hidden;\">"
                + "<div style=\"width:100%;\">"
                + nl2br(esc(text))
                + "</div></div>";
    }

    private static String shapeEl(AeroStudioCanvasElementDto el, String baseStyle) {
        String kind = el.shapeKind != null ? el.shapeKind.trim().toLowerCase() : "rect";
        String fill = safeColor(el.fill, "#e2e8f0");
        String stroke = safeColor(el.strokeColor, "#64748b");
        double sw = el.strokeWidthMm != null && el.strokeWidthMm > 0 ? el.strokeWidthMm : 0.4;
        return switch (kind) {
            case "circle" ->
                    "<div class=\"el shape circle\" style=\""
                            + baseStyle
                            + "background:"
                            + fill
                            + ";border-radius:50%;border:"
                            + sw
                            + "mm solid "
                            + stroke
                            + ";\"></div>";
            case "line" ->
                    "<div class=\"el shape line\" style=\""
                            + baseStyle
                            + "height:"
                            + sw
                            + "mm;background:"
                            + stroke
                            + ";margin-top:"
                            + (el.height / 2)
                            + "mm;\"></div>";
            default ->
                    "<div class=\"el shape rect\" style=\""
                            + baseStyle
                            + "background:"
                            + fill
                            + ";border:"
                            + sw
                            + "mm solid "
                            + stroke
                            + ";border-radius:1mm;\"></div>";
        };
    }

    private static String iconEl(AeroStudioCanvasElementDto el, String baseStyle) {
        String color = safeColor(el.color, "#0ea5e9");
        double pt = el.fontSizePt != null && el.fontSizePt > 8 ? el.fontSizePt : 24;
        return "<div class=\"el icon\" style=\""
                + baseStyle
                + "display:flex;align-items:center;justify-content:center;font-size:"
                + pt
                + "pt;color:"
                + color
                + ";\">"
                + esc(iconSymbol(el.iconClass))
                + "</div>";
    }

    private static String iconSymbol(String iconClass) {
        if (iconClass == null) {
            return "★";
        }
        return switch (iconClass.trim().toLowerCase()) {
            case "pi-plane", "pi-send" -> "✈";
            case "pi-phone" -> "☎";
            case "pi-envelope" -> "✉";
            case "pi-map-marker" -> "📍";
            case "pi-wrench" -> "🔧";
            case "pi-check" -> "✓";
            default -> "★";
        };
    }

    private static String imageEl(String src, String baseStyle, String alt) {
        if (src == null || src.isBlank()) {
            return "";
        }
        return "<div class=\"el img\" style=\""
                + baseStyle
                + "display:flex;align-items:center;justify-content:center;overflow:hidden;\">"
                + "<img src=\""
                + escAttr(src)
                + "\" alt=\""
                + esc(alt)
                + "\" style=\"max-width:100%;max-height:100%;object-fit:contain;"
                + "\"/>"
                + "</div>";
    }

    private static String page(
            AeroStudioRenderContext ctx, int trimW, int trimH, int bleed, String inner, boolean loopAnimations) {
        int pageW = trimW + bleed * 2;
        int pageH = trimH + bleed * 2;
        String crop = ctx.includeCropMarks ? cropMarksCss() : "";
        String animNote = loopAnimations ? "html,body{height:100%;}" : "";
        return """
            <!DOCTYPE html><html><head><meta charset="UTF-8"/><style>
            @page { size: %dmm %dmm; margin: 0; }
            * { box-sizing: border-box; }
            body { margin: 0; font-family: Arial, Helvetica, sans-serif; }
            .trim {
              position: relative;
              width: %dmm; height: %dmm;
              margin: %dmm;
              overflow: hidden;
            }
            .custom-canvas { position: relative; width: 100%%; height: 100%%; }
            %s
            %s
            %s
            </style></head><body><div class="trim">%s</div></body></html>
            """
                .formatted(
                        pageW,
                        pageH,
                        trimW,
                        trimH,
                        bleed,
                        AeroStudioCanvasStyleUtil.KEYFRAMES,
                        crop,
                        animNote,
                        inner);
    }

    private static String cropMarksCss() {
        return """
            .trim::before, .trim::after {
              content: ''; position: absolute; border: 0.2mm solid #999;
            }
            """;
    }

    private static String nl2br(String s) {
        return s.replace("\n", "<br/>");
    }

    private static String esc(String s) {
        return HtmlToPdfConverter.escapeHtml(s != null ? s : "");
    }

    private static String escAttr(String s) {
        return esc(s).replace("\"", "&quot;");
    }

    private static String safeAlign(String a) {
        if (a == null) {
            return "left";
        }
        return switch (a.toLowerCase()) {
            case "center", "right" -> a.toLowerCase();
            default -> "left";
        };
    }

    private static String safeColor(String c, String def) {
        if (c == null || c.isBlank()) {
            return def;
        }
        String s = c.trim();
        if (s.matches("#?[0-9A-Fa-f]{6}")) {
            return s.startsWith("#") ? s : "#" + s;
        }
        return def;
    }

    private static int clamp(int v, int min, int max) {
        return Math.max(min, Math.min(max, v));
    }

    private static double clampD(double v, double min, double max) {
        return Math.max(min, Math.min(max, v));
    }
}
