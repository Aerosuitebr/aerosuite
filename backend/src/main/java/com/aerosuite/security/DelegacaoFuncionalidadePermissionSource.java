package com.aerosuite.security;

import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.util.HashSet;
import java.util.List;
import java.util.Set;

/**
 * Permissões suplementares vindas de {@code usuario_delegacao_funcionalidade}.
 */
@ApplicationScoped
public class DelegacaoFuncionalidadePermissionSource implements SupplementalPermissionSource {

    @Inject
    EntityManager entityManager;

    @ConfigProperty(name = "aero.suite.security.delegacao.enabled", defaultValue = "true")
    boolean delegacaoEnabled;

    @Override
    @SuppressWarnings("unchecked")
    public Set<String> extraFuncionalidadeCodigosForUser(int userId) {
        if (!delegacaoEnabled) {
            return Set.of();
        }
        try {
            List<?> rows = entityManager.createNativeQuery(
                            "SELECT DISTINCT funcionalidade_codigo FROM usuario_delegacao_funcionalidade "
                                    + "WHERE usuario_grantee_id = ?1 AND ativo = 1 "
                                    + "AND data_inicio <= UTC_TIMESTAMP() "
                                    + "AND (data_fim IS NULL OR data_fim >= UTC_TIMESTAMP())")
                    .setParameter(1, userId)
                    .getResultList();
            Set<String> out = new HashSet<>();
            for (Object o : rows) {
                if (o != null) {
                    out.add(o.toString());
                }
            }
            return out;
        } catch (RuntimeException e) {
            return Set.of();
        }
    }
}
