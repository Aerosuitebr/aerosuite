package com.aerosuite.dto.studio;

import java.util.ArrayList;
import java.util.List;

/** Layout livre (editor drag-and-drop) serializado pelo frontend. */
public class AeroStudioCanvasLayoutDto {
    public int version = 1;
    public int widthMm;
    public int heightMm;
    public int bleedMm = 3;
    public String backgroundColor = "#ffffff";
    public List<AeroStudioCanvasElementDto> elements = new ArrayList<>();
}
