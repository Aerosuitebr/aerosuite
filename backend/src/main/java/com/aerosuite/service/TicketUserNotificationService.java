package com.aerosuite.service;

import com.aerosuite.domain.Ticket;
import com.aerosuite.i18n.TransactionalEmailMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

/**
 * Orquestra notificações ao solicitante do chamado: in-app (sempre) e e-mail (conforme preferências).
 */
@ApplicationScoped
public class TicketUserNotificationService {

    private static final Logger LOG = Logger.getLogger(TicketUserNotificationService.class);

    @Inject
    EmailService emailService;
    @Inject
    NotificacaoService notificacaoService;
    @Inject
    TicketNotificationPreferenceService preferenceService;
    @Inject
    TicketEmailDigestService digestService;

    public void onStatusChanged(Ticket ticket, String statusAnterior, String statusNovo, String motivoAguardando) {
        if (ticket == null || statusNovo == null || statusNovo.equals(statusAnterior)) {
            return;
        }

        notificacaoService.notificarEventoStatusTicket(ticket, statusAnterior, statusNovo);

        if ("RESOLVIDO".equals(statusNovo) || "FECHADO".equals(statusNovo)) {
            deliverUserEmail(
                    ticket,
                    "RESOLVIDO",
                    resumoStatus(ticket, statusAnterior, statusNovo),
                    () -> emailService.notificarChamadoResolvido(ticket));
        } else if ("AGUARDANDO_USUARIO".equals(statusNovo)) {
            String motivo = motivoAguardando != null && !motivoAguardando.isBlank()
                    ? motivoAguardando
                    : "Por favor, verifique o chamado no sistema.";
            deliverUserEmail(
                    ticket,
                    "AGUARDANDO",
                    resumoStatus(ticket, statusAnterior, statusNovo),
                    () -> emailService.notificarAguardandoUsuario(ticket, motivo));
        } else {
            deliverUserEmail(
                    ticket,
                    "STATUS",
                    resumoStatus(ticket, statusAnterior, statusNovo),
                    () -> emailService.notificarMudancaStatus(ticket, statusAnterior, statusNovo));
        }
    }

    public void onAttendantReply(Ticket ticket, String resposta, String nomeAtendente) {
        if (ticket == null) {
            return;
        }
        notificacaoService.notificarRespostaTicket(ticket, nomeAtendente);
        String resumo = ticket.numero + " — " + truncate(ticket.titulo, 80);
        deliverUserEmail(ticket, "RESPOSTA", resumo, () -> emailService.notificarNovaResposta(ticket, resposta, nomeAtendente));
    }

    private void deliverUserEmail(Ticket ticket, String eventoTipo, String resumo, Runnable instantSender) {
        if (ticket.usuarioEmail == null || ticket.usuarioEmail.isBlank()) {
            return;
        }
        Long usuarioId = ticket.usuarioId;
        if (usuarioId != null) {
            if (preferenceService.isOff(usuarioId)) {
                LOG.debugf("E-mail de chamado omitido (OFF) usuario=%d ticket=%s", usuarioId, ticket.numero);
                return;
            }
            if (preferenceService.isDigestDaily(usuarioId)) {
                digestService.enqueue(ticket, eventoTipo, resumo);
                return;
            }
        }
        try {
            instantSender.run();
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao enviar e-mail de chamado (%s): %s", eventoTipo, e.getMessage());
        }
    }

    private static String resumoStatus(Ticket ticket, String anterior, String novo) {
        String locale = ticket.usuarioId != null ? UserLocaleResolver.resolve(ticket.usuarioId) : "pt-BR";
        String num = ticket.numero != null ? ticket.numero : "—";
        String prev = TransactionalEmailMessages.ticketStatusLabelPublic(locale, anterior);
        String next = TransactionalEmailMessages.ticketStatusLabelPublic(locale, novo);
        return num + ": " + prev + " → " + next;
    }

    private static String truncate(String s, int max) {
        if (s == null || s.isBlank()) {
            return "";
        }
        String t = s.trim();
        return t.length() <= max ? t : t.substring(0, max - 3) + "...";
    }
}
