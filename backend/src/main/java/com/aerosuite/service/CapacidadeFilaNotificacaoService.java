package com.aerosuite.service;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioExterno;
import com.aerosuite.i18n.CapacidadeFilaMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.util.ServerUrlUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;
import org.jboss.logging.Logger;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;
import java.util.stream.Collectors;

/**
 * P5.3.3b/3c — notificações quando a fila de capacidade muda (in-app, e-mail, WhatsApp opcional).
 */
@ApplicationScoped
public class CapacidadeFilaNotificacaoService {

    private static final Logger LOG = Logger.getLogger(CapacidadeFilaNotificacaoService.class);
    private static final String TIPO = "OS_CAPACIDADE_FILA";

    @Inject
    NotificacaoService notificacaoService;

    @Inject
    EmailService emailService;

    @Inject
    WhatsAppService whatsAppService;

    @Inject
    ServerUrlUtil serverUrlUtil;

    @PersistenceContext
    EntityManager em;

    @Transactional
    public void notificarMudancaEstagio(OS os, String estagioAnterior, String estagioNovo, Long autorUsuarioId) {
        if (os == null || os.id == null || estagioNovo == null) {
            return;
        }
        if (estagioAnterior != null && estagioAnterior.equalsIgnoreCase(estagioNovo)) {
            return;
        }

        String estAnt = estagioAnterior != null ? estagioAnterior.toUpperCase(Locale.ROOT) : "—";
        String estNov = estagioNovo.toUpperCase(Locale.ROOT);
        int numero = os.idOs != null && os.idOs > 0 ? os.idOs : os.id.intValue();
        String cliente = os.clienteNome != null && !os.clienteNome.isBlank() ? os.clienteNome : "—";
        String link = "/capacidade";

        long tid = os.tenantId != null ? Long.parseLong(os.tenantId) : TenantConstants.DEFAULT_TENANT_ID;
        String linkInterno = link;
        if (!linkInterno.startsWith("http")) {
            String base = serverUrlUtil.getFrontendUrl();
            if (base.endsWith("/")) {
                base = base.substring(0, base.length() - 1);
            }
            linkInterno = base + link;
        }
        for (Long uid : listarUsuariosQuadroCapacidade(tid)) {
            if (autorUsuarioId != null && uid.equals(autorUsuarioId)) {
                continue;
            }
            Usuario u = Usuario.findById(uid.intValue());
            String locale = u != null ? UserLocaleResolver.resolve(u) : UserLocaleResolver.normalize(null);
            String labelAnt = CapacidadeFilaMessages.stageLabel(locale, estAnt);
            String labelNov = CapacidadeFilaMessages.stageLabel(locale, estNov);
            var inApp = CapacidadeFilaMessages.queueUpdated(locale, numero, labelAnt, labelNov, cliente);
            notificacaoService.criar(uid, TIPO, inApp.title(), inApp.message(), link);
            if (u != null && u.email != null && !u.email.isBlank() && Boolean.TRUE.equals(u.ativo)) {
                emailService.sendCapacidadeFilaAtualizacaoInterno(
                        u.email, numero, labelAnt, labelNov, cliente, linkInterno, locale);
            }
        }

        notificarClientesExternos(os, numero, estAnt, estNov);
    }

    private void notificarClientesExternos(OS os, int numeroOs, String estAnt, String estNov) {
        List<UsuarioExterno> externos = listarExternosDaOs(os.id);
        if (externos.isEmpty()) {
            return;
        }
        String baseUrl = serverUrlUtil.getFrontendUrl();
        if (baseUrl.endsWith("/")) {
            baseUrl = baseUrl.substring(0, baseUrl.length() - 1);
        }
        String linkPortal = baseUrl + "/externo/capacidade";
        for (UsuarioExterno ue : externos) {
            if (ue == null || ue.email == null || ue.email.isBlank()) {
                continue;
            }
            if (ue.ativo == null || !ue.ativo) {
                continue;
            }
            String locale = UserLocaleResolver.resolve(ue);
            String labelAnt = CapacidadeFilaMessages.stageLabel(locale, estAnt);
            String labelNov = CapacidadeFilaMessages.stageLabel(locale, estNov);
            String msgWhats = CapacidadeFilaMessages.whatsAppMessage(locale, numeroOs, labelAnt, labelNov, linkPortal);
            emailService.sendCapacidadeFilaAtualizacaoExterno(
                    ue.email, numeroOs, labelAnt, labelNov, linkPortal, locale);
            if (ue.telefone != null && !ue.telefone.isBlank() && whatsAppService.isApiConfigured()) {
                try {
                    whatsAppService.sendTextMessage(ue.telefone, msgWhats);
                } catch (Exception e) {
                    LOG.warnf(e, "Capacidade fila: WhatsApp falhou para externo %s", ue.id);
                }
            }
        }
    }

    @SuppressWarnings("unchecked")
    private List<UsuarioExterno> listarExternosDaOs(Long osId) {
        try {
            List<UsuarioExterno> list = em.createQuery(
                            "select distinct ueo.usuarioExterno from UsuarioExternoOS ueo "
                                    + "where ueo.os.id = ?1 and ueo.podeVisualizar = true "
                                    + "and ueo.usuarioExterno.ativo = true",
                            UsuarioExterno.class)
                    .setParameter(1, osId)
                    .getResultList();
            Set<Integer> seen = new LinkedHashSet<>();
            return list.stream()
                    .filter(u -> u != null && u.id != null && seen.add(u.id))
                    .collect(Collectors.toList());
        } catch (Exception e) {
            LOG.warnf(e, "Capacidade fila: falha ao listar externos da OS %s", osId);
            return List.of();
        }
    }

    private List<Long> listarUsuariosQuadroCapacidade(long tenantId) {
        try {
            @SuppressWarnings("unchecked")
            List<Integer> ids = em.createQuery(
                            "select distinct u.id from Usuario u join u.perfil p "
                                    + "where u.ativo = true and u.orgTenantId = ?1 and ("
                                    + " upper(trim(p.codigo)) in ('ADMIN','ADMINISTRADOR','DIRETOR','GERENTE','QUALIDADE',"
                                    + "'P145_RT','P145_INSPETOR','OPERADOR','GERENCIAR_PERMISSOES')"
                                    + "))",
                            Integer.class)
                    .setParameter(1, tenantId)
                    .getResultList();
            return ids.stream().map(Integer::longValue).collect(Collectors.toList());
        } catch (Exception e) {
            return List.of();
        }
    }
}
