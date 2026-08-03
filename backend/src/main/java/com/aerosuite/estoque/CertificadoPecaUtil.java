package com.aerosuite.estoque;

import com.aerosuite.domain.ItemEstoque;

/**
 * Validação de certificado de peça para material aeronáutico.
 * Itens legados ({@code certificadoConformidade} preenchido sem estrutura) permanecem válidos sem anexo.
 */
public final class CertificadoPecaUtil {

    public static final String ERROR_INCOMPLETO_SAIDA = "estoque.certificado.error.incompleto_saida";

    private CertificadoPecaUtil() {}

    public static boolean isCompleto(ItemEstoque item, boolean exigeAnexo) {
        if (item == null) {
            return false;
        }
        if (item.certTipo != null && !item.certTipo.isBlank()) {
            if (item.certNumero == null || item.certNumero.isBlank()) {
                return false;
            }
            if (exigeAnexo && !temAnexo(item)) {
                return false;
            }
            return true;
        }
        return item.certificadoConformidade != null && !item.certificadoConformidade.isBlank();
    }

    public static boolean temAnexo(ItemEstoque item) {
        return item != null
                && item.certAnexoPath != null
                && !item.certAnexoPath.isBlank();
    }

    public static void aplicarCampos(
            ItemEstoque item,
            String certTipo,
            String certNumero,
            String certEmissor,
            java.time.LocalDate certDataEmissao,
            java.time.LocalDate dataValidade,
            String certOrgaoAprovacao,
            String certificadoConformidadeLegado) {
        if (certTipo != null && !certTipo.isBlank()) {
            CertificadoPecaTipo.parse(certTipo)
                    .ifPresentOrElse(
                            t -> item.certTipo = t.name(),
                            () -> item.certTipo = certTipo.trim().toUpperCase(java.util.Locale.ROOT));
        }
        if (certNumero != null) {
            item.certNumero = certNumero.isBlank() ? null : certNumero.trim();
        }
        if (certEmissor != null) {
            item.certEmissor = certEmissor.isBlank() ? null : certEmissor.trim();
        }
        if (certDataEmissao != null) {
            item.certDataEmissao = certDataEmissao;
        }
        if (dataValidade != null) {
            item.dataValidade = dataValidade;
        }
        if (certOrgaoAprovacao != null) {
            item.certOrgaoAprovacao =
                    certOrgaoAprovacao.isBlank() ? null : certOrgaoAprovacao.trim();
        }
        if (certificadoConformidadeLegado != null) {
            item.certificadoConformidade =
                    certificadoConformidadeLegado.isBlank() ? null : certificadoConformidadeLegado.trim();
        }
        if (item.certNumero != null
                && (item.certificadoConformidade == null || item.certificadoConformidade.isBlank())) {
            item.certificadoConformidade = item.certNumero;
        }
    }
}
