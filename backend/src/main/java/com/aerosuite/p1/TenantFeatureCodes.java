package com.aerosuite.p1;

/** Códigos estáveis do {@link TenantFeatureCatalog} (evita strings soltas). */
public final class TenantFeatureCodes {

    public static final String ESTOQUE_SAIDA_VALIDACAO_EXTRA = "estoque.saida.validacaoExtra";
    /** Exige certificado estruturado (e anexo para registros novos) antes de saída/consumo em OS. */
    public static final String ESTOQUE_SAIDA_EXIGE_CERTIFICADO_PECA = "estoque.saida.exigeCertificadoPeca";
    public static final String ESTOQUE_CONSULTA_QR_HISTORICO_EXTENDIDO = "estoque.consultaQr.historicoExtendido";
    public static final String COMERCIAL_PROPOSTA_CAMPOS_EXTRAS = "comercial.proposta.camposExtras";
    public static final String MRO_OS_DASHBOARD_EXTENDIDO = "mro.os.dashboardExtendido";
    public static final String PLATFORM_UI_VARIANTE_PREMIUM = "platform.ui.variantePremium";

    private TenantFeatureCodes() {}
}
