package com.aerosuite.service;

import com.aerosuite.domain.Ticket;
import com.aerosuite.domain.TicketEmailDigestItem;
import com.aerosuite.domain.Usuario;
import com.aerosuite.i18n.TransactionalEmailMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import org.jboss.logging.Logger;

@ApplicationScoped
public class TicketEmailDigestService {

    private static final Logger LOG = Logger.getLogger(TicketEmailDigestService.class);

    @Inject
    EmailService emailService;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Transactional
    public void enqueue(Ticket ticket, String eventoTipo, String resumo) {
        if (ticket == null || ticket.usuarioId == null) {
            return;
        }
        TicketEmailDigestItem item = new TicketEmailDigestItem();
        item.tenantId = tenantDataAccess.currentTenantId();
        item.usuarioId = ticket.usuarioId.intValue();
        item.ticketId = ticket.id;
        item.eventoTipo = eventoTipo != null ? eventoTipo : "EVENTO";
        item.resumo = trimResumo(resumo);
        item.createdAt = LocalDateTime.now();
        item.persist();
        LOG.debugf(
                "Digest enfileirado usuario=%d ticket=%s evento=%s",
                item.usuarioId,
                ticket.numero,
                item.eventoTipo);
    }

    @Transactional
    public int processPendingForTenant(long tenantId) {
        if (!emailService.areNotificacoesEmailEnabled()) {
            return 0;
        }
        List<TicketEmailDigestItem> pending =
                TicketEmailDigestItem.find(
                                "tenantId = ?1 and sentAt is null order by usuarioId, createdAt",
                                tenantId)
                        .list();
        if (pending.isEmpty()) {
            return 0;
        }

        Map<Integer, List<TicketEmailDigestItem>> byUser = new LinkedHashMap<>();
        for (TicketEmailDigestItem item : pending) {
            byUser.computeIfAbsent(item.usuarioId, k -> new ArrayList<>()).add(item);
        }

        int sent = 0;
        LocalDateTime now = LocalDateTime.now();
        for (Map.Entry<Integer, List<TicketEmailDigestItem>> entry : byUser.entrySet()) {
            Integer usuarioId = entry.getKey();
            List<TicketEmailDigestItem> items = entry.getValue();
            Usuario usuario = Usuario.findById(usuarioId);
            if (usuario == null || usuario.email == null || usuario.email.isBlank()) {
                markSent(items, now);
                continue;
            }
            String locale = UserLocaleResolver.resolve(usuarioId.longValue());
            List<String> lines = new ArrayList<>();
            for (TicketEmailDigestItem item : items) {
                if (item.resumo != null && !item.resumo.isBlank()) {
                    lines.add(item.resumo.trim());
                }
            }
            if (lines.isEmpty()) {
                markSent(items, now);
                continue;
            }
            try {
                TransactionalEmailMessages.EmailContent content =
                        TransactionalEmailMessages.ticketDailyDigest(locale, lines);
                emailService.sendBrandedHtmlDirect(usuario.email.trim(), content);
                markSent(items, now);
                sent++;
                LOG.infof("Digest diário de chamados enviado para usuario=%d (%d eventos)", usuarioId, items.size());
            } catch (Exception e) {
                LOG.warnf(e, "Falha ao enviar digest diário para usuario=%d", usuarioId);
            }
        }
        return sent;
    }

    private void markSent(List<TicketEmailDigestItem> items, LocalDateTime sentAt) {
        for (TicketEmailDigestItem item : items) {
            item.sentAt = sentAt;
        }
    }

    private static String trimResumo(String resumo) {
        if (resumo == null || resumo.isBlank()) {
            return null;
        }
        String t = resumo.trim();
        return t.length() > 500 ? t.substring(0, 497) + "..." : t;
    }
}
