package com.aerosuite.service;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class BlingOsFluxoObserver {

    private static final Logger LOG = Logger.getLogger(BlingOsFluxoObserver.class);

    @Inject
    BlingPropostaFluxoService fluxoService;

    void onOsServicoConcluido(@Observes OsServicoConcluidoEvent event) {
        if (event == null) {
            return;
        }
        try {
            fluxoService.onOsConcluded(event.tenantId(), event.osId());
        } catch (Exception e) {
            LOG.warnf(e, "Fluxo Bling pós-conclusão OS %d", event.osId());
        }
    }
}
