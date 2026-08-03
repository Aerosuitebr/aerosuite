package com.aerosuite.security;

import com.aerosuite.domain.Usuario;
import com.aerosuite.model.Funcionalidade;
import com.aerosuite.model.Perfil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import org.hibernate.Hibernate;

import java.util.HashSet;
import java.util.List;
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

        Perfil perfil = u.perfil;
        String perfilCodigo = perfil != null ? perfil.getCodigo() : null;
        boolean perfilAtivo = perfil == null || Boolean.TRUE.equals(perfil.getAtivo());

        Set<String> codes = new HashSet<>();
        if (perfil != null && perfilAtivo) {
            codes.addAll(loadPerfilFuncionalidadeCodigos(u));
        }
        codes.addAll(supplementalPermissionSource.extraFuncionalidadeCodigosForUser(u.id));
        return new PermissionSnapshot(perfilCodigo, Set.copyOf(codes));
    }

    /**
     * Códigos do perfil sem {@code JOIN FETCH} da coleção — evita ~4s em Docker/Windows com MySQL no host.
     */
    private Set<String> loadPerfilFuncionalidadeCodigos(Usuario usuario) {
        if (usuario == null || usuario.id == null) {
            return Set.of();
        }
        Perfil perfil = usuario.perfil;
        if (perfil != null
                && perfil.getFuncionalidades() != null
                && Hibernate.isInitialized(perfil.getFuncionalidades())) {
            Set<String> fromMemory = new HashSet<>();
            for (Funcionalidade f : perfil.getFuncionalidades()) {
                if (f != null && Boolean.TRUE.equals(f.getAtivo()) && f.getCodigo() != null) {
                    fromMemory.add(f.getCodigo().trim());
                }
            }
            return fromMemory;
        }
        List<String> rows = entityManager.createQuery(
                        "SELECT DISTINCT f.codigo FROM Usuario u "
                                + "JOIN u.perfil p JOIN p.funcionalidades f "
                                + "WHERE u.id = :userId AND f.ativo = true AND f.codigo IS NOT NULL",
                        String.class)
                .setParameter("userId", usuario.id)
                .getResultList();
        Set<String> codes = new HashSet<>();
        for (String code : rows) {
            if (code != null && !code.isBlank()) {
                codes.add(code.trim());
            }
        }
        return codes;
    }

    public record PermissionSnapshot(String perfilCodigo, Set<String> funcionalidadeCodigos) {
    }
}
