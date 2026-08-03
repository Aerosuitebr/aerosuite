package com.aerosuite.service;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class BlingSyncScheduler {

    private static final Logger LOG = Logger.getLogger(BlingSyncScheduler.class);

    @Inject
    BlingSyncJobService syncJobService;

    @Inject
    BlingWebhookProcessor webhookProcessor;

    @ConfigProperty(name = "aero.suite.bling.sync.enabled", defaultValue = "true")
    boolean enabled;

    @Scheduled(every = "30s", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void tick() {
        if (!enabled) {
            return;
        }
        try {
            int n = syncJobService.processPendingBatch(10, webhookProcessor::processJob);
            if (n > 0) {
                LOG.debugf("Bling sync: %d jobs processados", n);
            }
        } catch (Exception e) {
            LOG.warn("Bling sync scheduler error", e);
        }
    }
}
