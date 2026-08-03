package com.aerosuite.service;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

@ApplicationScoped
public class FuncionalidadeConsultaTrocasEventuaisStartup {

    private static final Logger LOG = Logger.getLogger(FuncionalidadeConsultaTrocasEventuaisStartup.class);

    @Inject
    FuncionalidadeConsultaTrocasEventuaisSeeder seeder;

    void onStart(@Observes StartupEvent ev) {
        try {
            seeder.seed();
        } catch (Exception e) {
            LOG.warnf(e, "Falha ao garantir funcionalidade %s no banco. Execute db/scripts/add_funcionalidade_consulta_trocas_eventuais.sql se necessário.",
                    FuncionalidadeConsultaTrocasEventuaisSeeder.CODIGO);
        }
    }
}
