package com.aerosuite.studio;

import com.aerosuite.dto.studio.AeroStudioCanvasElementDto;
import com.aerosuite.dto.studio.AeroStudioCanvasLayoutDto;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertTrue;

class AeroStudioCustomHtmlBuilderTest {

    @Test
    void build_includesTextAndDimensions() {
        AeroStudioRenderContext ctx = new AeroStudioRenderContext();
        ctx.primaryColor = "#0ea5e9";
        ctx.displayName = "Test MRO";

        AeroStudioCanvasLayoutDto layout = new AeroStudioCanvasLayoutDto();
        layout.widthMm = 90;
        layout.heightMm = 50;
        layout.bleedMm = 3;
        layout.backgroundColor = "#ffffff";

        AeroStudioCanvasElementDto text = new AeroStudioCanvasElementDto();
        text.type = "text";
        text.x = 5;
        text.y = 5;
        text.width = 40;
        text.height = 10;
        text.zIndex = 1;
        text.text = "Hello Hangar";
        layout.elements = List.of(text);

        String html = AeroStudioCustomHtmlBuilder.build(ctx, layout);
        assertTrue(html.contains("Hello Hangar"));
        assertTrue(html.contains("@page { size: 96mm 56mm"));
        assertTrue(html.contains("custom-canvas"));
        assertTrue(html.contains("width: 90mm"));
        assertTrue(html.contains("height: 50mm"));
    }
}
