package com.aerosuite.dto.sistema;

/**
 * Resposta pública para o front (login, branding) — sem dados fiscais sensíveis.
 */
public class SistemaEmpresaPublicBrandingDto {
    public boolean configured;
    public String commercialName;
    public String commercialTagline;
    public String logoUrl;
    public String wordmarkUrl;
    public String wordmarkLightUrl;
    public String primaryColor;
    public String browserTitleSuffix;
    public String copyrightEntity;
    public String supportEmail;
    /** Telefone de contato público (cadastro da empresa). */
    public String telefone;
}
