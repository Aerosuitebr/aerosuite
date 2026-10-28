package com.aerosuite.service;

import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.NrcBusinessException;
import com.aerosuite.util.NrcErrorCode;
import com.aerosuite.util.NrcFuncionalidade;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;

import java.util.Collection;

/** Permissões NRC no perfil do usuário da organização atual. */
@ApplicationScoped
public class NrcAuthorization {

    @Inject
    EntityManager entityManager;

    @Inject
    TenantDataAccess tenants;

    public boolean usuarioTemFuncionalidade(Long usuarioId, String codigo) {
        if (usuarioId == null || codigo == null || codigo.isBlank()) {
            return false;
        }
        Long count = entityManager.createQuery(
                "SELECT COUNT(f) FROM Usuario u JOIN u.perfil p JOIN p.funcionalidades f "
                    + "WHERE u.id = :usuarioId AND u.orgTenantId = :tenantId "
                    + "AND f.codigo = :codigo AND f.ativo = true",
                Long.class)
            .setParameter("usuarioId", usuarioId.intValue())
            .setParameter("tenantId", tenants.currentTenantId())
            .setParameter("codigo", codigo.trim())
            .getSingleResult();
        return count != null && count > 0;
    }

    public boolean usuarioTemAlgumaFuncionalidade(Long usuarioId, Collection<String> codigos) {
        if (usuarioId == null || codigos == null || codigos.isEmpty()) {
            return false;
        }
        Long count = entityManager.createQuery(
                "SELECT COUNT(f) FROM Usuario u JOIN u.perfil p JOIN p.funcionalidades f "
                    + "WHERE u.id = :usuarioId AND u.orgTenantId = :tenantId "
                    + "AND f.codigo IN :codigos AND f.ativo = true",
                Long.class)
            .setParameter("usuarioId", usuarioId.intValue())
            .setParameter("tenantId", tenants.currentTenantId())
            .setParameter("codigos", codigos)
            .getSingleResult();
        return count != null && count > 0;
    }

    public void requireFuncionalidade(Long usuarioId, String codigo) {
        if (!usuarioTemFuncionalidade(usuarioId, codigo)) {
            throw new NrcBusinessException(
                NrcErrorCode.FUNCIONALIDADE_NEGADA,
                NrcErrorCode.FUNCIONALIDADE_NEGADA.defaultMessage(codigo));
        }
    }

    public void requireAlgumaFuncionalidade(Long usuarioId, Collection<String> codigos) {
        if (!usuarioTemAlgumaFuncionalidade(usuarioId, codigos)) {
            boolean allNrc = codigos != null && !codigos.isEmpty()
                && codigos.stream().allMatch(NrcFuncionalidade.ALL::contains);
            if (allNrc) {
                throw new NrcBusinessException(NrcErrorCode.FUNCIONALIDADE_NRC_NEGADA);
            }
            String codigo = codigos != null && !codigos.isEmpty() ? codigos.iterator().next() : "";
            throw new NrcBusinessException(
                NrcErrorCode.FUNCIONALIDADE_NEGADA,
                NrcErrorCode.FUNCIONALIDADE_NEGADA.defaultMessage(codigo));
        }
    }
}
