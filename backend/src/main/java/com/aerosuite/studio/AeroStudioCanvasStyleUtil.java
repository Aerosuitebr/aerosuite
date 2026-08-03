package com.aerosuite.studio;

import com.aerosuite.dto.studio.AeroStudioCanvasElementDto;
import com.aerosuite.dto.studio.AeroStudioCanvasLayoutDto;

public final class AeroStudioCanvasStyleUtil {

    private AeroStudioCanvasStyleUtil() {}

    public static final String KEYFRAMES =
            """
            @keyframes studio-fadeIn { from { opacity: 0; } to { opacity: 1; } }
            @keyframes studio-slideIn { from { transform: translateY(8mm); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
            @keyframes studio-pulse { 0%%, 100%% { transform: scale(1); } 50%% { transform: scale(1.04); } }
            @keyframes studio-bounce { 0%%, 100%% { transform: translateY(0); } 50%% { transform: translateY(-2mm); } }
            """;

    public static boolean hasAnimatedElements(AeroStudioCanvasLayoutDto layout) {
        if (layout == null || layout.elements == null) {
            return false;
        }
        for (AeroStudioCanvasElementDto el : layout.elements) {
            if (el != null && el.animation != null && !"none".equalsIgnoreCase(el.animation.trim())) {
                return true;
            }
        }
        return false;
    }

    public static String filterCss(String filter) {
        if (filter == null || filter.isBlank() || "none".equalsIgnoreCase(filter)) {
            return "";
        }
        return switch (filter.trim().toLowerCase()) {
            case "grayscale" -> "filter:grayscale(1);";
            case "sepia" -> "filter:sepia(0.85);";
            case "brightness" -> "filter:brightness(1.15);";
            case "contrast" -> "filter:contrast(1.25);";
            case "blur" -> "filter:blur(1px);";
            case "vivid" -> "filter:saturate(1.45) contrast(1.05);";
            default -> "";
        };
    }

    public static String animationCss(AeroStudioCanvasElementDto el, Double captureSec) {
        if (el == null || el.animation == null || el.animation.isBlank() || "none".equalsIgnoreCase(el.animation)) {
            return "";
        }
        double dur = el.animationDurationSec != null && el.animationDurationSec > 0 ? el.animationDurationSec : 1.0;
        double delay = el.animationDelaySec != null ? el.animationDelaySec : 0;
        if (captureSec != null) {
            delay = -(captureSec % dur);
        }
        String name =
                switch (el.animation.trim().toLowerCase()) {
                    case "fadein" -> "studio-fadeIn";
                    case "slidein" -> "studio-slideIn";
                    case "pulse" -> "studio-pulse";
                    case "bounce" -> "studio-bounce";
                    default -> null;
                };
        if (name == null) {
            return "";
        }
        String iter = captureSec != null ? "1" : (el.animationIteration != null ? el.animationIteration : "infinite");
        return "animation:" + name + " " + dur + "s ease " + delay + "s " + iter + " both;";
    }
}
