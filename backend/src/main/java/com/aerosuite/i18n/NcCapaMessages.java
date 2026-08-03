package com.aerosuite.i18n;

/**
 * Rótulos das fases CAPA de não conformidade (4 locales).
 */
public final class NcCapaMessages {

    private NcCapaMessages() {}

    public static String faseLabel(String locale, String fase) {
        String loc = UserLocaleResolver.normalize(locale);
        String f = fase != null ? fase.trim().toUpperCase() : "";
        return switch (f) {
            case "REGISTRO" -> switch (loc) {
                case "en-US" -> "Record";
                case "es-ES" -> "Registro";
                case "fr-FR" -> "Enregistrement";
                default -> "Registro";
            };
            case "CONTENCAO" -> switch (loc) {
                case "en-US" -> "Containment";
                case "es-ES" -> "Contención";
                case "fr-FR" -> "Confinement";
                default -> "Contenção";
            };
            case "CAUSA" -> switch (loc) {
                case "en-US" -> "Root cause";
                case "es-ES" -> "Causa raíz";
                case "fr-FR" -> "Cause racine";
                default -> "Causa raiz";
            };
            case "ACAO" -> switch (loc) {
                case "en-US" -> "Corrective action";
                case "es-ES" -> "Acción correctiva";
                case "fr-FR" -> "Action corrective";
                default -> "Ação corretiva";
            };
            case "VERIFICACAO" -> switch (loc) {
                case "en-US" -> "Verification";
                case "es-ES" -> "Verificación";
                case "fr-FR" -> "Vérification";
                default -> "Verificação";
            };
            case "FECHADA" -> switch (loc) {
                case "en-US" -> "Closed";
                case "es-ES" -> "Cerrada";
                case "fr-FR" -> "Fermée";
                default -> "Fechada";
            };
            default -> f;
        };
    }
}
