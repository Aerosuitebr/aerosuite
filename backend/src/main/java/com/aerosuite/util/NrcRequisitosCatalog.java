package com.aerosuite.util;

import java.util.List;

/** Standard requirement / process codes for NRC opening (i18n labels live on the client). */
public final class NrcRequisitosCatalog {

    public static final List<String> CODIGOS = List.of(
        "ISO9001_8.7",
        "ISO9001_9.2",
        "ISO9001_10.2",
        "ISO14001_8.1",
        "PROC_COMPRAS",
        "PROC_PRODUCAO",
        "PROC_EXPEDICAO",
        "PROC_ALMOXARIFADO",
        "PROC_RH",
        "PROC_QUALIDADE"
    );

    private NrcRequisitosCatalog() {
    }

    public static void requireReferenciaFiltro(String value) {
        if (value == null || value.isBlank()) {
            return;
        }
        if (!CODIGOS.contains(value.trim())) {
            throw new NrcBusinessException(NrcErrorCode.VALOR_INVALIDO_VALOR,
                NrcErrorCode.VALOR_INVALIDO_VALOR.defaultMessage("requisitoReferencia", value.trim()));
        }
    }
}
