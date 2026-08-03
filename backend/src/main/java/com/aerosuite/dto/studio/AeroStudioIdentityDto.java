package com.aerosuite.dto.studio;

import java.util.List;

/** Dados de identidade do tenant para o wizard Aero Studio. */
public class AeroStudioIdentityDto {
    public boolean onboardingCompleto;
    public String displayName;
    public String tagline;
    public String supportEmail;
    public String telefone;
    public String siteUrl;
    public String logoUrl;
    public String enderecoFormatado;
    public String tenantCodigo;
    public String portalQrUrl;
    /** PNG data URI para pré-visualização do QR no editor (mesmo URL do portal externo). */
    public String portalQrPreviewDataUri;
    public List<String> servicosTop;
    public String primaryColorDefault = "#0ea5e9";
    public String secondaryColorDefault = "#1e293b";
}
