package com.aerosuite.service;

import io.quarkus.scheduler.Scheduled;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

/**
 * Reprocessa automações do fluxo Bling (OS/NF-e) sem depender do botão manual na proposta.
 */
@ApplicationScoped
public class BlingFluxoRetryScheduler {

    private static final Logger LOG = Logger.getLogger(BlingFluxoRetryScheduler.class);

    @Inject
    BlingPropostaFluxoService fluxoService;

    @ConfigProperty(name = "aero.suite.bling.fluxo-retry.enabled", defaultValue = "true")
    boolean enabled;

    @Scheduled(every = "2m", concurrentExecution = Scheduled.ConcurrentExecution.SKIP)
    void tick() {
        if (!enabled) {
            return;
        }
        try {
            int n = fluxoService.retryPendingAutomationsBatch(8);
            if (n > 0) {
                LOG.debugf("Bling fluxo retry: %d proposta(s) reprocessada(s)", n);
            }
        } catch (Exception e) {
            LOG.warn("Bling fluxo retry scheduler error", e);
        }
    }
}
