package com.aerosuite.i18n;

import java.util.Locale;

/**
 * Textos de notificações in-app persistidas no servidor (4 locales).
 */
public final class InAppNotificationMessages {

    public record LocalizedText(String title, String message) {}

    private InAppNotificationMessages() {}

    public static LocalizedText blingNfeAuthorized(
            String locale, String numero, String situacao, String numeroProposta) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = blank(numero) ? "—" : numero.trim();
        String sit = blank(situacao) ? defaultSituacao(loc) : situacao.trim();
        String propSuffix = blank(numeroProposta) ? "" : propostaSuffix(loc, numeroProposta.trim());
        return switch (loc) {
            case "en-US" -> new LocalizedText(
                    "Invoice #" + num + " authorized",
                    "Bling invoice " + sit + propSuffix);
            case "es-ES" -> new LocalizedText(
                    "Factura #" + num + " autorizada",
                    "Factura Bling " + sit + propSuffix);
            case "fr-FR" -> new LocalizedText(
                    "Facture n° " + num + " autorisée",
                    "Facture Bling " + sit + propSuffix);
            default -> new LocalizedText(
                    "NF-e #" + num + " autorizada",
                    "NF-e Bling " + sit + propSuffix);
        };
    }

    public static LocalizedText ticketResposta(String locale, String numero, String atendente, String tituloTicket) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = blank(numero) ? "—" : numero.trim();
        String att = blank(atendente) ? "—" : atendente.trim();
        String tit = blank(tituloTicket) ? "" : tituloTicket.trim();
        return switch (loc) {
            case "en-US" -> new LocalizedText(
                    "New reply on ticket " + num,
                    att + " replied to your ticket: " + tit);
            case "es-ES" -> new LocalizedText(
                    "Nueva respuesta en el ticket " + num,
                    att + " respondió a su ticket: " + tit);
            case "fr-FR" -> new LocalizedText(
                    "Nouvelle réponse sur le ticket " + num,
                    att + " a répondu à votre ticket : " + tit);
            default -> new LocalizedText(
                    "Nova resposta no chamado " + num,
                    att + " respondeu ao seu chamado: " + tit);
        };
    }

    public static LocalizedText ticketResolvido(String locale, String numero, String tituloTicket) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = blank(numero) ? "—" : numero.trim();
        String tit = blank(tituloTicket) ? "" : tituloTicket.trim();
        return switch (loc) {
            case "en-US" -> new LocalizedText(
                    "Ticket " + num + " resolved",
                    "Your ticket \"" + tit + "\" was marked as resolved. Please confirm the issue is fixed.");
            case "es-ES" -> new LocalizedText(
                    "Ticket " + num + " resuelto",
                    "Su ticket \"" + tit + "\" fue marcado como resuelto. Verifique si el problema fue solucionado.");
            case "fr-FR" -> new LocalizedText(
                    "Ticket " + num + " résolu",
                    "Votre ticket \"" + tit + "\" a été marqué comme résolu. Vérifiez que le problème est corrigé.");
            default -> new LocalizedText(
                    "Chamado " + num + " foi resolvido",
                    "Seu chamado \"" + tit + "\" foi marcado como resolvido. Verifique se o problema foi solucionado.");
        };
    }

    public static LocalizedText ticketAguardandoUsuario(String locale, String numero, String tituloTicket) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = blank(numero) ? "—" : numero.trim();
        String tit = blank(tituloTicket) ? "" : tituloTicket.trim();
        return switch (loc) {
            case "en-US" -> new LocalizedText(
                    "Action required on ticket " + num,
                    "Ticket \"" + tit + "\" is waiting for your reply or action.");
            case "es-ES" -> new LocalizedText(
                    "Acción requerida en el ticket " + num,
                    "El ticket \"" + tit + "\" está esperando su respuesta o acción.");
            case "fr-FR" -> new LocalizedText(
                    "Action requise sur le ticket " + num,
                    "Le ticket \"" + tit + "\" attend votre réponse ou action.");
            default -> new LocalizedText(
                    "Ação necessária no chamado " + num,
                    "O chamado \"" + tit + "\" está aguardando sua resposta ou ação.");
        };
    }

    public static LocalizedText ticketStatusChanged(
            String locale, String numero, String tituloTicket, String statusAnterior, String statusNovo) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = blank(numero) ? "—" : numero.trim();
        String tit = blank(tituloTicket) ? "" : tituloTicket.trim();
        String prev = TransactionalEmailMessages.ticketStatusLabelPublic(statusAnterior);
        String next = TransactionalEmailMessages.ticketStatusLabelPublic(statusNovo);
        return switch (loc) {
            case "en-US" -> new LocalizedText(
                    "Ticket " + num + " status updated",
                    "Ticket \"" + tit + "\" changed from " + prev + " to " + next + ".");
            case "es-ES" -> new LocalizedText(
                    "Estado del ticket " + num + " actualizado",
                    "El ticket \"" + tit + "\" pasó de " + prev + " a " + next + ".");
            case "fr-FR" -> new LocalizedText(
                    "Statut du ticket " + num + " mis à jour",
                    "Le ticket \"" + tit + "\" est passé de " + prev + " à " + next + ".");
            default -> new LocalizedText(
                    "Status do chamado " + num + " atualizado",
                    "O chamado \"" + tit + "\" mudou de " + prev + " para " + next + ".");
        };
    }

    public static LocalizedText ticketFechado(String locale, String numero, String tituloTicket) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = blank(numero) ? "—" : numero.trim();
        String tit = blank(tituloTicket) ? "" : tituloTicket.trim();
        return switch (loc) {
            case "en-US" -> new LocalizedText(
                    "Ticket " + num + " closed",
                    "Your ticket \"" + tit + "\" was closed.");
            case "es-ES" -> new LocalizedText(
                    "Ticket " + num + " cerrado",
                    "Su ticket \"" + tit + "\" fue cerrado.");
            case "fr-FR" -> new LocalizedText(
                    "Ticket " + num + " fermé",
                    "Votre ticket \"" + tit + "\" a été fermé.");
            default -> new LocalizedText(
                    "Chamado " + num + " fechado",
                    "Seu chamado \"" + tit + "\" foi fechado.");
        };
    }

    public static LocalizedText adSbDailyAlert(
            String locale, long total, int diasJanela, long vencidas, long proximas) {
        String loc = UserLocaleResolver.normalize(locale);
        return switch (loc) {
            case "en-US" -> new LocalizedText(
                    "AD/SB: " + total + " alert(s) in the next " + diasJanela + " days",
                    vencidas + " overdue, " + proximas + " due soon.");
            case "es-ES" -> new LocalizedText(
                    "AD/SB: " + total + " alerta(s) en los próximos " + diasJanela + " días",
                    vencidas + " vencida(s), " + proximas + " por vencer pronto.");
            case "fr-FR" -> new LocalizedText(
                    "AD/SB : " + total + " alerte(s) dans les " + diasJanela + " prochains jours",
                    vencidas + " en retard, " + proximas + " à échéance proche.");
            default -> new LocalizedText(
                    "AD/SB: " + total + " alerta(s) nos próximos " + diasJanela + " dias",
                    vencidas + " vencida(s), " + proximas + " vencendo em breve.");
        };
    }

    public static LocalizedText ncCapaFasePendente(
            String locale, String numeroNc, String tituloNc, String faseLabel) {
        String loc = UserLocaleResolver.normalize(locale);
        String num = blank(numeroNc) ? "—" : numeroNc.trim();
        String tit = blank(tituloNc) ? "—" : tituloNc.trim();
        String fase = blank(faseLabel) ? "—" : faseLabel.trim();
        return switch (loc) {
            case "en-US" -> new LocalizedText(
                    "CAPA phase pending — " + num,
                    "You are responsible for the \"" + fase + "\" phase of NC " + num + ": " + tit + ".");
            case "es-ES" -> new LocalizedText(
                    "Fase CAPA pendiente — " + num,
                    "Usted es responsable de la fase \"" + fase + "\" de la NC " + num + ": " + tit + ".");
            case "fr-FR" -> new LocalizedText(
                    "Phase CAPA en attente — " + num,
                    "Vous êtes responsable de la phase \"" + fase + "\" de la NC " + num + " : " + tit + ".");
            default -> new LocalizedText(
                    "Fase CAPA pendente — " + num,
                    "Você é responsável pela fase \"" + fase + "\" da NC " + num + ": " + tit + ".");
        };
    }

    private static String propostaSuffix(String loc, String numeroProposta) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> " — proposal " + numeroProposta;
            case "es-ES" -> " — propuesta " + numeroProposta;
            case "fr-FR" -> " — proposition " + numeroProposta;
            default -> " — proposta " + numeroProposta;
        };
    }

    private static String defaultSituacao(String loc) {
        return switch (UserLocaleResolver.normalize(loc)) {
            case "en-US" -> "Authorized";
            case "es-ES" -> "Autorizada";
            case "fr-FR" -> "Autorisée";
            default -> "Autorizada";
        };
    }

    private static boolean blank(String s) {
        return s == null || s.isBlank();
    }
}
