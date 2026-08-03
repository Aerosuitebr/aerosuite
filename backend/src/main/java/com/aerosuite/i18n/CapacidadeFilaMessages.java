package com.aerosuite.i18n;

/**
 * Textos da fila de capacidade (in-app, WhatsApp e rótulos de estágio) em 4 locales.
 */
public final class CapacidadeFilaMessages {

    private CapacidadeFilaMessages() {}

    public static String stageLabel(String locale, String codigo) {
        String loc = UserLocaleResolver.normalize(locale);
        String code = codigo == null ? "—" : codigo.toUpperCase(java.util.Locale.ROOT);
        return switch (code) {
            case "AGUARDANDO" -> switch (loc) {
                case "en-US" -> "Waiting";
                case "es-ES" -> "En espera";
                case "fr-FR" -> "En attente";
                default -> "Aguardando";
            };
            case "EM_EXECUCAO" -> switch (loc) {
                case "en-US" -> "In progress";
                case "es-ES" -> "En ejecución";
                case "fr-FR" -> "En cours";
                default -> "Em execução";
            };
            case "AGUARDANDO_PECAS" -> switch (loc) {
                case "en-US" -> "Waiting for parts";
                case "es-ES" -> "Esperando piezas";
                case "fr-FR" -> "En attente de pièces";
                default -> "Aguardando peças";
            };
            case "INSPECAO" -> switch (loc) {
                case "en-US" -> "Inspection";
                case "es-ES" -> "Inspección";
                case "fr-FR" -> "Inspection";
                default -> "Inspeção";
            };
            default -> codigo == null ? "—" : codigo;
        };
    }

    public static InAppNotificationMessages.LocalizedText queueUpdated(
            String locale, int numeroOs, String labelAnt, String labelNov, String cliente) {
        String loc = UserLocaleResolver.normalize(locale);
        String cli = blank(cliente) ? "—" : cliente.trim();
        return switch (loc) {
            case "en-US" -> new InAppNotificationMessages.LocalizedText(
                    "WO " + numeroOs + " — queue updated",
                    "Stage: " + labelAnt + " → " + labelNov + " · Customer: " + cli);
            case "es-ES" -> new InAppNotificationMessages.LocalizedText(
                    "OT " + numeroOs + " — cola actualizada",
                    "Etapa: " + labelAnt + " → " + labelNov + " · Cliente: " + cli);
            case "fr-FR" -> new InAppNotificationMessages.LocalizedText(
                    "OT " + numeroOs + " — file mise à jour",
                    "Étape : " + labelAnt + " → " + labelNov + " · Client : " + cli);
            default -> new InAppNotificationMessages.LocalizedText(
                    "OS " + numeroOs + " — fila atualizada",
                    "Estágio: " + labelAnt + " → " + labelNov + " · Cliente: " + cli);
        };
    }

    public static String whatsAppMessage(
            String locale, int numeroOs, String labelAnt, String labelNov, String linkPortal) {
        String loc = UserLocaleResolver.normalize(locale);
        return switch (loc) {
            case "en-US" -> "Aero Suite — WO " + numeroOs + ": " + labelAnt + " → " + labelNov + ". " + linkPortal;
            case "es-ES" -> "Aero Suite — OT " + numeroOs + ": " + labelAnt + " → " + labelNov + ". " + linkPortal;
            case "fr-FR" -> "Aero Suite — OT " + numeroOs + " : " + labelAnt + " → " + labelNov + ". " + linkPortal;
            default -> "Aero Suite — OS " + numeroOs + ": " + labelAnt + " → " + labelNov + ". " + linkPortal;
        };
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
