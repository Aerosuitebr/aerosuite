package com.aerosuite.service;

import com.aerosuite.domain.Notificacao;
import com.aerosuite.domain.Ticket;
import com.aerosuite.i18n.InAppNotificationMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import org.jboss.logging.Logger;

@ApplicationScoped
public class NotificacaoService {

    private static final Logger LOG = Logger.getLogger(NotificacaoService.class);

    public List<Notificacao> buscarNaoLidas(Long usuarioId) {
        return Notificacao.find(
                        "usuarioId = ?1 and lida = false and isActive = true order by dataCriacao desc",
                        usuarioId)
                .list();
    }

    public List<Notificacao> buscarTodas(Long usuarioId, int page, int size) {
        return Notificacao.find("usuarioId = ?1 and isActive = true order by dataCriacao desc", usuarioId)
                .page(page, size)
                .list();
    }

    public long contarNaoLidas(Long usuarioId) {
        return Notificacao.count("usuarioId = ?1 and lida = false and isActive = true", usuarioId);
    }

    @Transactional
    public void marcarComoLida(Long notificacaoId) {
        Notificacao notif = Notificacao.findById(notificacaoId);
        if (notif != null && !notif.lida) {
            notif.lida = true;
            notif.dataLeitura = LocalDateTime.now();
        }
    }

    @Transactional
    public void marcarTodasComoLidas(Long usuarioId) {
        Notificacao.update(
                "lida = true, dataLeitura = ?1 where usuarioId = ?2 and lida = false",
                LocalDateTime.now(),
                usuarioId);
    }

    @Transactional
    public void notificarRespostaTicket(Ticket ticket, String nomeAtendente) {
        if (ticket.usuarioId == null) {
            return;
        }
        String locale = UserLocaleResolver.resolve(ticket.usuarioId);
        InAppNotificationMessages.LocalizedText text = InAppNotificationMessages.ticketResposta(
                locale, ticket.numero, nomeAtendente, ticket.titulo);
        persistTicketNotification(ticket, "TICKET_RESPOSTA", text);
        LOG.infof("Notificação de resposta criada para usuário %d - Ticket %s", ticket.usuarioId, ticket.numero);
    }

    @Transactional
    public void notificarTicketResolvido(Ticket ticket) {
        if (ticket.usuarioId == null) {
            return;
        }
        String locale = UserLocaleResolver.resolve(ticket.usuarioId);
        InAppNotificationMessages.LocalizedText text =
                InAppNotificationMessages.ticketResolvido(locale, ticket.numero, ticket.titulo);
        persistTicketNotification(ticket, "TICKET_RESOLVIDO", text);
        LOG.infof("Notificação de resolução criada para usuário %d - Ticket %s", ticket.usuarioId, ticket.numero);
    }

    @Transactional
    public void notificarAguardandoUsuario(Ticket ticket) {
        if (ticket.usuarioId == null) {
            return;
        }
        String locale = UserLocaleResolver.resolve(ticket.usuarioId);
        InAppNotificationMessages.LocalizedText text =
                InAppNotificationMessages.ticketAguardandoUsuario(locale, ticket.numero, ticket.titulo);
        persistTicketNotification(ticket, "TICKET_AGUARDANDO", text);
        LOG.infof("Notificação de aguardando criada para usuário %d - Ticket %s", ticket.usuarioId, ticket.numero);
    }

    @Transactional
    public void notificarEventoStatusTicket(Ticket ticket, String statusAnterior, String statusNovo) {
        if (ticket.usuarioId == null || statusNovo == null || statusNovo.equals(statusAnterior)) {
            return;
        }
        String locale = UserLocaleResolver.resolve(ticket.usuarioId);
        InAppNotificationMessages.LocalizedText text;
        String tipo;
        if ("RESOLVIDO".equals(statusNovo)) {
            text = InAppNotificationMessages.ticketResolvido(locale, ticket.numero, ticket.titulo);
            tipo = "TICKET_RESOLVIDO";
        } else if ("FECHADO".equals(statusNovo)) {
            text = InAppNotificationMessages.ticketFechado(locale, ticket.numero, ticket.titulo);
            tipo = "TICKET_FECHADO";
        } else if ("AGUARDANDO_USUARIO".equals(statusNovo)) {
            text = InAppNotificationMessages.ticketAguardandoUsuario(locale, ticket.numero, ticket.titulo);
            tipo = "TICKET_AGUARDANDO";
        } else {
            text = InAppNotificationMessages.ticketStatusChanged(
                    locale, ticket.numero, ticket.titulo, statusAnterior, statusNovo);
            tipo = "TICKET_STATUS";
        }
        persistTicketNotification(ticket, tipo, text);
        LOG.infof(
                "Notificação in-app de status (%s) criada para usuário %d - Ticket %s",
                statusNovo,
                ticket.usuarioId,
                ticket.numero);
    }

    @Transactional
    public Notificacao criar(Long usuarioId, String tipo, String titulo, String mensagem, String link) {
        Notificacao notif = new Notificacao();
        notif.usuarioId = usuarioId;
        notif.tipo = tipo;
        notif.titulo = titulo;
        notif.mensagem = mensagem;
        notif.link = link;
        notif.lida = false;
        notif.isActive = true;
        notif.persist();
        return notif;
    }

    @Transactional
    public void deletar(Long notificacaoId) {
        Notificacao notif = Notificacao.findById(notificacaoId);
        if (notif != null) {
            notif.isActive = false;
        }
    }

    private void persistTicketNotification(
            Ticket ticket, String tipo, InAppNotificationMessages.LocalizedText text) {
        Notificacao notif = new Notificacao();
        notif.usuarioId = ticket.usuarioId;
        notif.tipo = tipo;
        notif.titulo = text.title();
        notif.mensagem = text.message();
        notif.link = "/suporte/chamados/" + ticket.id;
        notif.referenciaTipo = "TICKET";
        notif.referenciaId = ticket.id;
        notif.lida = false;
        notif.isActive = true;
        notif.persist();
    }
}
