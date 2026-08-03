package com.aerosuite.dto.studio;

public class AeroStudioRenderRequestDto {
    public String templateId;
    public String locale;
    public Boolean includeCropMarks;
    public Boolean includeQrPortal;
    public Boolean packageZip;
    public String primaryColor;
    public String secondaryColor;
    public String taglineOverride;
    public String servicesText;
    /** Sobrescreve campos da identidade da empresa (pré-visualização / export sem gravar config). */
    public String displayNameOverride;
    public String supportEmailOverride;
    public String telefoneOverride;
    public String siteUrlOverride;
    public String enderecoOverride;
    /** Preset fixo de papel timbrado (sem editor de layout). */
    public String letterheadPresetId;
    /** Força fila assíncrona (banner usa por defeito). */
    public Boolean async;
    /** Inclui preview.png no ZIP (cartão inclui por defeito). */
    public Boolean includePngInZip;
    /** Layout livre do editor visual (drag-and-drop). */
    public AeroStudioCanvasLayoutDto customLayout;
    /** Captura frame de animação (segundos) para GIF / preview. */
    public Double animationCaptureSec;
    /** Inclui animated.html e preview.gif no ZIP quando aplicável. */
    public Boolean includeAnimatedExport;
}
