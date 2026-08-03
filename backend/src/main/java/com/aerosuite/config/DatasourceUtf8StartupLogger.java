package com.aerosuite.config;

import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.logging.Logger;

import java.util.Optional;

/** Avisa no arranque se a URL JDBC ou o ambiente podem causar perda de acentos. */
@ApplicationScoped
public class DatasourceUtf8StartupLogger {

    private static final Logger LOG = Logger.getLogger(DatasourceUtf8StartupLogger.class);

    @ConfigProperty(name = "quarkus.datasource.jdbc.url")
    String jdbcUrl;

    void onStart(@Observes StartupEvent event) {
        Optional<String> envUrl = Optional.ofNullable(System.getenv("QUARKUS_DATASOURCE_JDBC_URL"));
        String effective = envUrl.orElse(jdbcUrl);
        if (effective == null || effective.isBlank()) {
            return;
        }
        boolean ok = effective.contains("useUnicode=true") && effective.contains("characterEncoding=");
        if (!ok) {
            LOG.warn(
                    "QUARKUS_DATASOURCE_JDBC_URL sem useUnicode/characterEncoding — acentos podem aparecer como ??. "
                            + "Execute scripts/fix-jdbc-utf8-env.ps1 ou adicione "
                            + "&characterEncoding=UTF-8&useUnicode=true&connectionCollation=utf8mb4_unicode_ci. "
                            + "O backend aplica SET NAMES utf8mb4 e propriedades JDBC extra quando possível.");
        } else {
            LOG.info("JDBC URL configurada para UTF-8 (acentuação PT/ES/FR).");
        }
    }
}
