package com.aerosuite.p1;

import java.util.*;

/**
 * Mapeamento funcionalidade → módulo SaaS (feature flag por tenant).
 */
public final class TenantModuleCatalog {

    public static final String MRO = "MRO";
    public static final String ESTOQUE = "ESTOQUE";
    public static final String COMERCIAL = "COMERCIAL";

    public static final List<String> DEFAULT_MODULES = List.of(MRO, ESTOQUE, COMERCIAL);

    private static final Map<String, String> CODIGO_TO_MODULO = Map.ofEntries(
            Map.entry("ORDEM_SERVICO", MRO),
            Map.entry("CONSULTA_TROCAS_EVENTUAIS", MRO),
            Map.entry("ESTOQUE", ESTOQUE),
            Map.entry("ESTOQUE_ENTRADA", ESTOQUE),
            Map.entry("ESTOQUE_SAIDA", ESTOQUE),
            Map.entry("PROPOSTAS_COMERCIAIS", COMERCIAL),
            Map.entry("PROPOSTAS-COMERCIAIS", COMERCIAL),
            Map.entry("TEMPLATES_PROPOSTA", COMERCIAL),
            Map.entry("TEMPLATES-PROPOSTA", COMERCIAL),
            Map.entry("CLIENTES_PROPOSTA", COMERCIAL));

    private TenantModuleCatalog() {}

    public static Set<String> parseModulos(String raw) {
        if (raw == null || raw.isBlank()) {
            return new LinkedHashSet<>(DEFAULT_MODULES);
        }
        Set<String> out = new LinkedHashSet<>();
        for (String part : raw.split(",")) {
            String m = part.trim().toUpperCase(Locale.ROOT);
            if (!m.isEmpty()) {
                out.add(m);
            }
        }
        return out.isEmpty() ? new LinkedHashSet<>(DEFAULT_MODULES) : out;
    }

    public static String normalizeModulosList(Collection<String> modulos) {
        if (modulos == null || modulos.isEmpty()) {
            return String.join(",", DEFAULT_MODULES);
        }
        return String.join(",", modulos);
    }

    public static String moduloForFuncionalidadeCodigo(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            return null;
        }
        String c = codigo.trim().toUpperCase(Locale.ROOT).replace('-', '_');
        String direct = CODIGO_TO_MODULO.get(c);
        if (direct != null) {
            return direct;
        }
        if (c.contains("PROPOSTA") || c.contains("COMERCIAL") || c.contains("TEMPLATE")) {
            return COMERCIAL;
        }
        if (c.startsWith("ESTOQUE") || c.contains("INVOICE") || c.contains("FORNECEDOR")) {
            return ESTOQUE;
        }
        if (c.contains("ORDEM") || c.contains("OS_") || c.equals("OS")) {
            return MRO;
        }
        return null;
    }

    public static boolean isFuncionalidadeAllowed(Set<String> enabledModules, String funcionalidadeCodigo) {
        String modulo = moduloForFuncionalidadeCodigo(funcionalidadeCodigo);
        if (modulo == null) {
            return true;
        }
        return enabledModules.contains(modulo);
    }
}
