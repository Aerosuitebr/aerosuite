package com.aerosuite.p1;

import com.aerosuite.i18n.ApiI18nMessages;

import java.util.*;

/**
 * Catálogo oficial de feature flags por tenant. Códigos estáveis em notação {@code modulo.area.nome}.
 * Metadados de governação (owner, piloto, revisão) vivem aqui; estado on/off por tenant em {@code tenant_feature}.
 */
public final class TenantFeatureCatalog {

    public record FeatureDefinition(
            String code,
            String modulo,
            boolean experimental,
            String owner,
            String pilotTenant,
            String reviewDate) {}

    private static final List<FeatureDefinition> CATALOG = List.of(
            new FeatureDefinition(
                    "estoque.saida.validacaoExtra",
                    TenantModuleCatalog.ESTOQUE,
                    true,
                    "produto",
                    null,
                    null),
            new FeatureDefinition(
                    "estoque.saida.exigeCertificadoPeca",
                    TenantModuleCatalog.ESTOQUE,
                    false,
                    "produto",
                    null,
                    null),
            new FeatureDefinition(
                    "estoque.consultaQr.historicoExtendido",
                    TenantModuleCatalog.ESTOQUE,
                    true,
                    "produto",
                    null,
                    null),
            new FeatureDefinition(
                    "comercial.proposta.camposExtras",
                    TenantModuleCatalog.COMERCIAL,
                    true,
                    "produto",
                    null,
                    null),
            new FeatureDefinition(
                    "mro.os.dashboardExtendido",
                    TenantModuleCatalog.MRO,
                    true,
                    "produto",
                    null,
                    null),
            new FeatureDefinition(
                    "platform.ui.variantePremium",
                    "PLATFORM",
                    false,
                    "produto",
                    null,
                    null));

    private static final Map<String, FeatureDefinition> BY_CODE;

    static {
        Map<String, FeatureDefinition> map = new LinkedHashMap<>();
        for (FeatureDefinition def : CATALOG) {
            map.put(normalizeCode(def.code()), def);
        }
        BY_CODE = Collections.unmodifiableMap(map);
    }

    private TenantFeatureCatalog() {}

    public static List<FeatureDefinition> all() {
        return CATALOG;
    }

    public static Optional<FeatureDefinition> find(String code) {
        if (code == null || code.isBlank()) {
            return Optional.empty();
        }
        return Optional.ofNullable(BY_CODE.get(normalizeCode(code)));
    }

    public static boolean isKnown(String code) {
        return find(code).isPresent();
    }

    public static String normalizeCode(String code) {
        return code.trim().toLowerCase(Locale.ROOT);
    }

    public static void validateCodes(Collection<String> codes) {
        if (codes == null) {
            return;
        }
        for (String code : codes) {
            if (code == null || code.isBlank()) {
                continue;
            }
            if (!isKnown(code)) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TENANT_FEATURE_UNKNOWN, "code", code));
            }
        }
    }

    /** Módulo SaaS exigido para a flag; null se desconhecida. */
    public static String moduloFor(String code) {
        return find(code).map(FeatureDefinition::modulo).orElse(null);
    }
}
