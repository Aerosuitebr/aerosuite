package com.aerosuite.crs;

import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * Checklist estável para emissão de CRS (liberação para serviço).
 */
public final class OsCrsChecklist {

    public record Item(String code, String labelPt, String labelEn, String labelEs, String labelFr) {}

    private static final List<Item> ITEMS =
            List.of(
                    new Item(
                            "manual_aprovado",
                            "Serviço executado conforme dados/manuais aprovados registrados na OS",
                            "Work performed per approved data/manuals recorded on the work order",
                            "Servicio ejecutado conforme datos/manuales aprobados registrados en la OS",
                            "Travaux réalisés selon les données/manuels approuvés enregistrés sur l'OS"),
                    new Item(
                            "pecas_rastreaveis",
                            "Peças consumidas/instaladas com rastreio documentado (quando aplicável)",
                            "Parts used/installed with documented traceability (when applicable)",
                            "Piezas consumidas/instaladas con trazabilidad documentada (cuando aplique)",
                            "Pièces consommées/installées avec traçabilité documentée (le cas échéant)"),
                    new Item(
                            "registros_completos",
                            "Registros de trabalho e anexos da OS completos para revisão",
                            "Work records and WO attachments complete for review",
                            "Registros de trabajo y anexos de la OS completos para revisión",
                            "Dossiers de travail et pièces jointes OS complets pour revue"),
                    new Item(
                            "inspecao_liberacao",
                            "Inspeção de liberação realizada por pessoa autorizada",
                            "Release inspection performed by authorized person",
                            "Inspección de liberación realizada por persona autorizada",
                            "Inspection de libération effectuée par une personne autorisée"),
                    new Item(
                            "conformidade_declarada",
                            "Declaro que a aeronave/componente está apto(a) para retorno ao serviço, salvo ressalvas no texto",
                            "I declare the aircraft/component fit for return to service unless noted below",
                            "Declaro que la aeronave/componente está apta para retorno al servicio, salvo ressalvas",
                            "Je déclare l'aéronef/la pièce apte au retour en service, sauf réserves ci-dessous"));

    private OsCrsChecklist() {}

    public static List<Item> all() {
        return ITEMS;
    }

    public static List<String> labelsForLocale(String locale) {
        String key = locale != null ? locale.toLowerCase(Locale.ROOT) : "pt-br";
        return ITEMS.stream()
                .map(item -> label(item, key))
                .toList();
    }

    public static Map<String, String> codesToLabels(String locale) {
        String key = locale != null ? locale.toLowerCase(Locale.ROOT) : "pt-br";
        return ITEMS.stream().collect(java.util.stream.Collectors.toMap(i -> i.code, i -> label(i, key)));
    }

    public static boolean isValidCodes(List<String> confirmed) {
        if (confirmed == null || confirmed.size() < ITEMS.size()) {
            return false;
        }
        return confirmed.stream().distinct().count() >= ITEMS.size()
                && ITEMS.stream().allMatch(i -> confirmed.contains(i.code));
    }

    private static String label(Item item, String key) {
        if (key.startsWith("en")) {
            return item.labelEn;
        }
        if (key.startsWith("es")) {
            return item.labelEs;
        }
        if (key.startsWith("fr")) {
            return item.labelFr;
        }
        return item.labelPt;
    }
}
