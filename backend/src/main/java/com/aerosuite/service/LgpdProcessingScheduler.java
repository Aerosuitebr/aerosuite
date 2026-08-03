package com.aerosuite.service;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class LgpdProcessingScheduler {

    private static final Logger LOG = Logger.getLogger(LgpdProcessingScheduler.class);

    @Inject
    LgpdSolicitacaoProcessor processor;

    @ConfigProperty(name = "aero.suite.lgpd.processing.enabled", defaultValue = "true")
    boolean enabled;

    @Scheduled(every = "30s", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void tick() {
        if (!enabled) {
            return;
        }
        try {
            int n = processor.processPendingBatch(5);
            if (n > 0) {
                LOG.debugf("LGPD: processadas %d solicitações", n);
            }
        } catch (Exception e) {
            LOG.warn("LGPD scheduler error", e);
        }
    }
}
