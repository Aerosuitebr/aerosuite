package com.aerosuite.service;

import com.aerosuite.domain.TenantWhatsAppConnection;
import com.aerosuite.integration.evolution.EvolutionPlatformConfig;
import com.aerosuite.integration.evolution.EvolutionService;
import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import java.util.List;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Sincroniza status CONNECTED/DISCONNECTED a partir da Evolution API quando o webhook
 * não está acessível (ambiente local Docker) ou como reforço periódico.
 */
@ApplicationScoped
public class WhatsAppConnectionSyncScheduler {

    private static final Logger LOG = Logger.getLogger(WhatsAppConnectionSyncScheduler.class);

    @Inject
    EvolutionPlatformConfig platformConfig;

    @Inject
    EvolutionService evolutionService;

    @ConfigProperty(name = "aero.suite.evolution.connection-sync.enabled", defaultValue = "true")
    boolean enabled;

    @Scheduled(every = "20s", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void syncConnectingTenants() {
        if (!enabled || !platformConfig.isConfigured()) {
            return;
        }
        try {
            @SuppressWarnings("unchecked")
            List<TenantWhatsAppConnection> pending = (List<TenantWhatsAppConnection>) (List<?>)
                    TenantWhatsAppConnection.find(
                                    "whatsappStatus in (?1, ?2)",
                                    com.aerosuite.domain.WhatsAppConnectionStatus.CONNECTING.name(),
                                    com.aerosuite.domain.WhatsAppConnectionStatus.CONNECTED.name())
                            .page(0, 50)
                            .list();
            for (TenantWhatsAppConnection conn : pending) {
                if (conn == null || conn.tenantId == null) {
                    continue;
                }
                // Revalida CONNECTED (pode ter caído) e promove CONNECTING → CONNECTED após QR.
                evolutionService.syncConnectionStateFromEvolution(conn.tenantId);
            }
        } catch (Exception e) {
            LOG.debug("WhatsApp connection sync tick error", e);
        }
    }
}
