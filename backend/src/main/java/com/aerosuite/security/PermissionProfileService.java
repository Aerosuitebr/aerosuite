package com.aerosuite.security;

import com.aerosuite.domain.Usuario;
import com.aerosuite.service.UsuarioPerfilService;
import com.aerosuite.model.Perfil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;
import jakarta.ws.rs.NotAuthorizedException;

import java.util.HashSet;
import java.util.List;
import java.util.Objects;
import java.util.Set;

/**
 * Resolve códigos de funcionalidade do utilizador interno a partir do perfil em BD.
 */
@ApplicationScoped
public class PermissionProfileService {

    @Inject
    SupplementalPermissionSource supplementalPermissionSource;

    @Inject
    PermissionSnapshotRequestCache requestCache;

    @Inject
    EntityManager entityManager;

    @Inject UsuarioPerfilService usuarioPerfis;
    @Inject InternalUserContext context;

    public PermissionSnapshot loadSnapshot(int userId) {
        return requestCache.getOrLoad(userId, this::loadSnapshotUncached);
    }

    /**
     * Reutiliza perfil já carregado (ex.: login com JOIN FETCH) para evitar segunda query.
     */
    public PermissionSnapshot loadSnapshot(Usuario usuario) {
        if (usuario == null || usuario.id == null) {
            return new PermissionSnapshot(null, Set.of());
        }
        if (usuario.perfil != null && Hibernate.isInitialized(usuario.perfil)) {
            return requestCache.getOrLoad(usuario.id, uid -> snapshotFromUsuario(usuario));
        }
        return loadSnapshot(usuario.id);
    }

    private PermissionSnapshot loadSnapshotUncached(int userId) {
        Usuario u = Usuario.find(
                "SELECT DISTINCT u FROM Usuario u LEFT JOIN FETCH u.perfil p WHERE u.id = ?1",
                userId).firstResult();
        if (u == null) {
            return new PermissionSnapshot(null, Set.of());
        }
        return snapshotFromUsuario(u);
    }

    private PermissionSnapshot snapshotFromUsuario(Usuario u) {
        if (u == null || !Boolean.TRUE.equals(u.ativo)) {
            return new PermissionSnapshot(null, Set.of());
        }

        if (context.getPerfisRevisao() != null && Objects.equals(context.getUserId(), u.id)
                && context.getPerfisRevisao() != u.perfisRevisao) {
            throw new NotAuthorizedException("Bearer");
        }

        List<Perfil> perfis = usuarioPerfis.efetivos(u);
        Perfil principal = usuarioPerfis.principal(perfis, u.perfil);
        Set<String> codes = new HashSet<>();
        if (!perfis.isEmpty()) {
            entityManager.createQuery(
                    "SELECT DISTINCT f.codigo FROM Perfil p JOIN p.funcionalidades f "
                            + "WHERE p.id IN :ids AND f.ativo = true AND f.codigo IS NOT NULL", String.class)
                    .setParameter("ids", perfis.stream().map(Perfil::getId).toList()).getResultList().stream()
                    .map(String::trim).filter(code -> !code.isEmpty()).forEach(codes::add);
        }
        codes.addAll(supplementalPermissionSource.extraFuncionalidadeCodigosForUser(u.id));
        return new PermissionSnapshot(principal == null ? null : principal.getCodigo(), Set.copyOf(codes));
    }

    public record PermissionSnapshot(String perfilCodigo, Set<String> funcionalidadeCodigos) {
    }
}
