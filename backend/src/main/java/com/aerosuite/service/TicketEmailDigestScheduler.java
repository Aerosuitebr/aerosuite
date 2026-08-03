package com.aerosuite.service;

import com.aerosuite.domain.Tenant;
import com.aerosuite.domain.Ticket;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/** Envia digest diário de e-mails de chamados enfileirados (modo DIGEST_DAILY). */
@ApplicationScoped
public class TicketEmailDigestScheduler {

    private static final Logger LOG = Logger.getLogger(TicketEmailDigestScheduler.class);

    @Inject
    TicketEmailDigestService digestService;

    @Inject
    TenantHibernateScope tenantHibernateScope;

    @ConfigProperty(name = "aero.suite.ticket.digest.enabled", defaultValue = "true")
    boolean enabled;

    @Scheduled(cron = "${aero.suite.ticket.digest.cron:0 0 8 * * ?}")
    void dailyDigest() {
        if (!enabled) {
            return;
        }
        List<Tenant> tenants = Tenant.find("ativo = true order by id").list();
        for (Tenant tenant : tenants) {
            if (tenant == null || tenant.id == null) {
                continue;
            }
            try {
                tenantHibernateScope.runInNewTransaction(
                        tenant.id, () -> digestService.processPendingForTenant(tenant.id));
            } catch (Exception e) {
                LOG.warnf(e, "Ticket digest scheduler error tenant=%d", tenant.id);
            }
        }
    }
}
