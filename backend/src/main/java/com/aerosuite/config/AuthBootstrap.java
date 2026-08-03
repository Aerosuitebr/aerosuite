package com.aerosuite.config;

import com.aerosuite.domain.TenantConstants;
import com.aerosuite.domain.Usuario;
import com.aerosuite.security.PasswordCredentials;
import io.quarkus.runtime.StartupEvent;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import org.jboss.logging.Logger;

/**
 * Garante utilizador admin de plataforma no arranque — fora do caminho crítico de {@code POST /auth/login}.
 */
@ApplicationScoped
public class AuthBootstrap {

    private static final Logger LOG = Logger.getLogger(AuthBootstrap.class);

    @Transactional
    void onStart(@Observes StartupEvent event) {
        Usuario existing = Usuario.find("email = ?1", "admin@aerosuite.com").firstResult();
        if (existing != null) {
            return;
        }
        Usuario admin = new Usuario();
        admin.email = "admin@aerosuite.com";
        admin.nome = "Administrador";
        admin.senha = PasswordCredentials.hash("admin123");
        admin.dataCadastro = LocalDate.now();
        admin.orgTenantId = TenantConstants.DEFAULT_TENANT_ID;
        admin.ativo = true;
        admin.persist();
        LOG.info("Utilizador admin@aerosuite.com criado no arranque (dev/homologação).");
    }
}
