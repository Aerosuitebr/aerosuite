package com.aerosuite.service;

/**
 * Política de SLA de chamados: prioridade base + ajuste por ambiente.
 * <ul>
 *   <li>Produção — prazos reduzidos (impacto operacional direto)</li>
 *   <li>Homologação — referência padrão</li>
 *   <li>Desenvolvimento — prazos ampliados</li>
 * </ul>
 */
public final class TicketSlaPolicy {

    public static final String MODIFIER_ACCELERATED = "ACCELERATED";
    public static final String MODIFIER_STANDARD = "STANDARD";
    public static final String MODIFIER_RELAXED = "RELAXED";

    public record SlaTargets(
            int primeiraRespostaMinutos,
            int resolucaoMinutos,
            String ambienteModifier,
            int primeiraRespostaHoras,
            int resolucaoHoras) {}

    private TicketSlaPolicy() {}

    public static SlaTargets calcular(String prioridade, String ambiente, String categoria) {
        String prio = normalizePrioridade(prioridade);
        int basePr = basePrimeiraRespostaMinutos(prio);
        int baseRes = baseResolucaoMinutos(prio);

        double factor = factorAmbiente(normalizeAmbiente(ambiente));
        String modifier = modifierAmbiente(normalizeAmbiente(ambiente));

        int pr = (int) Math.max(30, Math.round(basePr * factor));
        int res = (int) Math.max(pr * 2L, Math.round(baseRes * factor));

        // Categoria crítica operacional em produção: leve ajuste adicional (-10 % resolução)
        if ("PRODUCAO".equals(normalizeAmbiente(ambiente)) && isCategoriaOperacional(categoria)) {
            res = (int) Math.max(pr * 2L, Math.round(res * 0.9));
        }

        return new SlaTargets(
                pr,
                res,
                modifier,
                minutosParaHorasArredondadas(pr),
                minutosParaHorasArredondadas(res));
    }

    public static int minutosParaHorasArredondadas(int minutos) {
        return Math.max(1, (minutos + 59) / 60);
    }

    private static boolean isCategoriaOperacional(String categoria) {
        if (categoria == null || categoria.isBlank()) {
            return false;
        }
        String c = categoria.trim().toUpperCase(java.util.Locale.ROOT);
        return "OS".equals(c) || "ESTOQUE".equals(c) || "INTEGRACAO".equals(c) || "FCU".equals(c);
    }

    private static String normalizePrioridade(String prioridade) {
        if (prioridade == null || prioridade.isBlank()) {
            return "MEDIA";
        }
        return prioridade.trim().toUpperCase(java.util.Locale.ROOT);
    }

    private static String normalizeAmbiente(String ambiente) {
        if (ambiente == null || ambiente.isBlank()) {
            return "";
        }
        return ambiente.trim().toUpperCase(java.util.Locale.ROOT);
    }

    private static int basePrimeiraRespostaMinutos(String prioridade) {
        return switch (prioridade) {
            case "CRITICA" -> 60;
            case "ALTA" -> 240;
            case "MEDIA" -> 480;
            case "BAIXA" -> 1440;
            default -> 480;
        };
    }

    private static int baseResolucaoMinutos(String prioridade) {
        return switch (prioridade) {
            case "CRITICA" -> 240;
            case "ALTA" -> 1440;
            case "MEDIA" -> 2880;
            case "BAIXA" -> 4320;
            default -> 2880;
        };
    }

    private static double factorAmbiente(String ambiente) {
        return switch (ambiente) {
            case "PRODUCAO" -> 0.5;
            case "DESENVOLVIMENTO" -> 1.5;
            case "HOMOLOGACAO" -> 1.0;
            default -> 1.0;
        };
    }

    private static String modifierAmbiente(String ambiente) {
        return switch (ambiente) {
            case "PRODUCAO" -> MODIFIER_ACCELERATED;
            case "DESENVOLVIMENTO" -> MODIFIER_RELAXED;
            default -> MODIFIER_STANDARD;
        };
    }
}
