package com.aerosuite.integration.bling;

import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.fasterxml.jackson.databind.node.ObjectNode;
import java.math.BigDecimal;

/** Montagem de campos fiscais nos payloads JSON da API Bling. */
public final class BlingFiscalPayloadHelper {

    private static final String DEFAULT_UNIT = "UN";

    private BlingFiscalPayloadHelper() {}

    public static String resolveNcm(TenantBlingFiscalConfig fiscal) {
        if (fiscal == null || fiscal.ncmPadrao == null || fiscal.ncmPadrao.isBlank()) {
            return null;
        }
        String digits = fiscal.ncmPadrao.replaceAll("\\D", "");
        return digits.length() == 8 ? digits : fiscal.ncmPadrao.trim();
    }

    public static String defaultUnit() {
        return DEFAULT_UNIT;
    }

    public static void applyFiscalToItem(ObjectNode row, TenantBlingFiscalConfig fiscal) {
        if (fiscal == null || row == null) {
            return;
        }
        if (fiscal.cfopPadrao != null && !fiscal.cfopPadrao.isBlank()) {
            row.put("cfop", fiscal.cfopPadrao.trim());
        }
        if (fiscal.ncmPadrao != null && !fiscal.ncmPadrao.isBlank()) {
            row.put("ncm", fiscal.ncmPadrao.trim());
        }
        putAliquota(row, "icms", fiscal.aliquotaIcms);
        putAliquota(row, "pis", fiscal.aliquotaPis);
        putAliquota(row, "cofins", fiscal.aliquotaCofins);
    }

    private static void putAliquota(ObjectNode row, String imposto, BigDecimal aliquota) {
        if (aliquota == null) {
            return;
        }
        ObjectNode node = row.putObject(imposto);
        node.put("aliquota", aliquota.doubleValue());
    }
}
