package com.aerosuite.service;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

@ApplicationScoped
public class WhatsAppMessageScheduler {

    private static final Logger LOG = Logger.getLogger(WhatsAppMessageScheduler.class);

    @Inject
    WhatsAppMessageJobService jobService;

    @Inject
    WhatsAppMessageProcessor processor;

    @ConfigProperty(name = "aero.suite.evolution.sync.enabled", defaultValue = "true")
    boolean enabled;

    @Scheduled(every = "15s", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void tick() {
        if (!enabled) {
            return;
        }
        try {
            int n = jobService.processPendingBatch(10, processor::processJob);
            if (n > 0) {
                LOG.debugf("WhatsApp jobs: %d processados", n);
            }
        } catch (Exception e) {
            LOG.warn("WhatsApp message scheduler error", e);
        }
    }
}
