package com.aerosuite.service;

import com.aerosuite.domain.Notificacao;
import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.AeroDiretrizAlertasResumoDto;
import com.aerosuite.i18n.InAppNotificationMessages;
import com.aerosuite.i18n.UserLocaleResolver;
import com.aerosuite.model.Funcionalidade;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import java.util.List;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Alertas operacionais AD/SB — notificação in-app diária quando há diretrizes vencendo no tenant.
 */
@ApplicationScoped
public class AeroDiretrizAlertasScheduler {

    private static final Logger LOG = Logger.getLogger(AeroDiretrizAlertasScheduler.class);
    private static final String REF_TIPO = "AD_SB_ALERTA_DIA";

    @Inject
    AeroDiretrizService diretrizService;

    @Inject
    NotificacaoService notificacaoService;

    @Inject
    EntityManager entityManager;

    @Inject
    TenantHibernateScope tenantHibernateScope;

    @ConfigProperty(name = "aero.suite.aero.alertas.enabled", defaultValue = "true")
    boolean enabled;

    @Scheduled(cron = "0 0 7 * * ?")
    void dailyAlertas() {
        if (!enabled) {
            return;
        }
        List<Tenant> tenants = Tenant.find("ativo = true order by id").list();
        for (Tenant tenant : tenants) {
            if (tenant == null || tenant.id == null) {
                continue;
            }
            try {
                tenantHibernateScope.runInNewTransaction(tenant.id, () -> processTenantAlertas(tenant.id));
            } catch (Exception e) {
                LOG.warnf(e, "AD/SB alertas scheduler error tenant=%d", tenant.id);
            }
        }
    }

    @Transactional
    void processTenantAlertas(long tenantId) {
        AeroDiretrizAlertasResumoDto resumo = diretrizService.alertas(30);
        if (resumo == null) {
            return;
        }
        long total = resumo.totalVencidas + resumo.totalProximas;
        if (total <= 0) {
            return;
        }
        long refId = LocalDate.now().toEpochDay();
        if (alreadyNotifiedToday(tenantId, refId)) {
            return;
        }
        String link = "/aero/diretrizes";
        List<Usuario> destinatarios = usuariosComAlertas(tenantId);
        for (Usuario usuario : destinatarios) {
            if (usuario.id == null) {
                continue;
            }
            InAppNotificationMessages.LocalizedText text = InAppNotificationMessages.adSbDailyAlert(
                    UserLocaleResolver.resolve(usuario),
                    total,
                    resumo.diasJanela,
                    resumo.totalVencidas,
                    resumo.totalProximas);
            Notificacao n = notificacaoService.criar(
                    usuario.id.longValue(), "AD_SB_ALERTA", text.title(), text.message(), link);
            n.referenciaTipo = REF_TIPO;
            n.referenciaId = refId;
        }
        LOG.infof("AD/SB alertas tenant=%d: notificados %d usuário(s), total=%d", tenantId, destinatarios.size(), total);
    }

    private boolean alreadyNotifiedToday(long tenantId, long refId) {
        Long count = entityManager.createQuery(
                        "SELECT COUNT(n) FROM Notificacao n JOIN Usuario u ON u.id = n.usuarioId "
                                + "WHERE n.referenciaTipo = :refTipo AND n.referenciaId = :refId "
                                + "AND n.isActive = true AND u.orgTenantId = :tenantId",
                        Long.class)
                .setParameter("refTipo", REF_TIPO)
                .setParameter("refId", refId)
                .setParameter("tenantId", tenantId)
                .getSingleResult();
        return count != null && count > 0;
    }

    private List<Usuario> usuariosComAlertas(long tenantId) {
        List<Usuario> usuarios = entityManager.createQuery(
                        "SELECT DISTINCT u FROM Usuario u "
                                + "LEFT JOIN u.perfil p "
                                + "LEFT JOIN p.funcionalidades f "
                                + "WHERE u.ativo = true AND u.orgTenantId = :tenantId "
                                + "AND (p IS NULL OR p.ativo = true)",
                        Usuario.class)
                .setParameter("tenantId", tenantId)
                .getResultList();
        return usuarios.stream()
                .filter(u -> u.id != null && u.perfil != null && u.perfil.getFuncionalidades() != null)
                .filter(u -> u.perfil.getFuncionalidades().stream()
                        .filter(f -> f != null && Boolean.TRUE.equals(f.getAtivo()))
                        .map(Funcionalidade::getCodigo)
                        .anyMatch(c -> "AD_SB_ALERTAS".equals(c)
                                || "ORDEM_SERVICO".equals(c)
                                || "GERENCIAR_PERMISSOES".equals(c)))
                .toList();
    }
}
