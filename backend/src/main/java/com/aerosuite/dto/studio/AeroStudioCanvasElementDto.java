package com.aerosuite.dto.studio;

/** Elemento posicionado no canvas (mm, área útil). */
public class AeroStudioCanvasElementDto {
    public String id;
    /** text | shape | logo | qr | image | circle | line | icon */
    public String type;
    public double x;
    public double y;
    public double width;
    public double height;
    public int zIndex;
    public Integer rotation;
    public String text;
    public Double fontSizePt;
    public String fontWeight;
    public String color;
    public String textAlign;
    public String fill;
    public String imageUrl;
    public String shapeKind;
    public String strokeColor;
    public Double strokeWidthMm;
    public String iconClass;
    public String filter;
    public String animation;
    public Double animationDurationSec;
    public Double animationDelaySec;
    public String animationIteration;
}
