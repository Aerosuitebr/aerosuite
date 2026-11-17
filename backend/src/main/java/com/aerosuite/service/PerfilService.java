package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.PerfilDTO;
import com.aerosuite.model.Perfil;
import com.aerosuite.model.Funcionalidade;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.ForbiddenException;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;

@ApplicationScoped
public class PerfilService {
    
    @Inject
    EntityManager entityManager;

    @Inject
    TenantDataAccess tenantDataAccess;

    private static final Set<String> RESERVED_CODES = Set.of("ADMIN", "ADMINISTRADOR", "DIRETOR", "PLATFORM_OPS");

    @ConfigProperty(name = "aero.suite.security.super-perfil-codigos", defaultValue = "ADMIN,ADMINISTRADOR,DIRETOR")
    String superPerfilCodigos;
    
    public List<Perfil> listarTodos() {
        return listarParaGestaoRbac();
    }

    /** Perfis visíveis na matriz RBAC do tenant (exclui perfis ocultos do plano de controle). */
    public List<Perfil> listarParaGestaoRbac() {
        return entityManager.createQuery(
            "SELECT p FROM Perfil p WHERE p.ativo = true AND p.oculto = false "
                + "AND (p.ownerTenantId IS NULL OR p.ownerTenantId = :tenantId) ORDER BY p.nome ASC",
            Perfil.class
        ).setParameter("tenantId", tenantDataAccess.currentTenantId()).getResultList();
    }
    
    public Perfil buscarPorId(Long id) {
        Perfil perfil = entityManager.find(Perfil.class, id);
        if (perfil == null || Boolean.TRUE.equals(perfil.getOculto())) {
            return null;
        }
        return perfil.disponivelParaTenant(tenantDataAccess.currentTenantId()) ? perfil : null;
    }

    public Perfil buscarAtribuivel(Long id) {
        Perfil perfil = buscarPorId(id);
        return perfil != null && Boolean.TRUE.equals(perfil.getAtivo()) ? perfil : null;
    }

    private Perfil requireEditable(Long id) {
        Perfil perfil = buscarPorId(id);
        if (perfil == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PERFIL_NOT_FOUND));
        }
        if (perfil.getOwnerTenantId() == null) {
            throw new ForbiddenException("Perfis padrão da plataforma são somente leitura.");
        }
        return perfil;
    }

    private String validateCode(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new IllegalArgumentException("Informe o código do perfil.");
        }
        String trimmed = codigo.trim();
        String canonical = trimmed.toUpperCase(Locale.ROOT);
        if (RESERVED_CODES.contains(canonical)
                || SistemaEmpresaConfigService.isSuperPerfil(canonical, superPerfilCodigos)) {
            throw new IllegalArgumentException("Este código é reservado para um perfil padrão da plataforma.");
        }
        boolean sharedCode = entityManager.createQuery(
                "SELECT COUNT(p) FROM Perfil p WHERE p.ownerTenantId IS NULL AND UPPER(TRIM(p.codigo)) = :code",
                Long.class).setParameter("code", canonical).getSingleResult() > 0;
        if (sharedCode) {
            throw new IllegalArgumentException("Este código é reservado para um perfil padrão da plataforma.");
        }
        return trimmed;
    }
    
    @Transactional
    public Perfil criar(PerfilDTO dto) {
        Perfil perfil = new Perfil();
        perfil.setNome(dto.getNome());
        perfil.setDescricao(dto.getDescricao());
        perfil.setCodigo(validateCode(dto.getCodigo()));
        perfil.setOwnerTenantId(tenantDataAccess.currentTenantId());
        perfil.setAtivo(dto.getAtivo() != null ? dto.getAtivo() : true);
        
        entityManager.persist(perfil);
        return perfil;
    }
    
    @Transactional
    public Perfil atualizar(Long id, PerfilDTO dto) {
        Perfil perfil = requireEditable(id);
        
        perfil.setNome(dto.getNome());
        perfil.setDescricao(dto.getDescricao());
        if (!Objects.equals(perfil.getCodigo(), dto.getCodigo())) {
            perfil.setCodigo(validateCode(dto.getCodigo()));
        }
        perfil.setAtivo(dto.getAtivo());
        
        return entityManager.merge(perfil);
    }

    @Transactional
    public boolean deletar(Long id) {
        Perfil perfil = requireEditable(id);
        // Soft delete - apenas marca como inativo
        perfil.setAtivo(false);
        entityManager.merge(perfil);
        return true;
    }

    @Transactional
    public void atribuirFuncionalidades(Long perfilId, List<Long> funcionalidadeIds) {
        Perfil perfil = requireEditable(perfilId);
        
        // Limpar funcionalidades existentes
        perfil.getFuncionalidades().clear();
        
        // Adicionar novas funcionalidades
        if (funcionalidadeIds != null && !funcionalidadeIds.isEmpty()) {
            List<Funcionalidade> funcionalidades = entityManager.createQuery(
                "SELECT f FROM Funcionalidade f WHERE f.id IN :ids AND f.ativo = true "
                    + "AND (f.gestaoRbac = true OR f.gestaoRbac IS NULL)",
                Funcionalidade.class
            ).setParameter("ids", funcionalidadeIds).getResultList();

            if (funcionalidades.size() != Set.copyOf(funcionalidadeIds).size()) {
                throw new IllegalArgumentException("Uma ou mais funcionalidades não podem ser atribuídas ao perfil.");
            }
            
            perfil.getFuncionalidades().addAll(funcionalidades);
        }
        
        entityManager.merge(perfil);
    }
    
    public List<Funcionalidade> listarFuncionalidades(Long perfilId) {
        if (buscarPorId(perfilId) == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PERFIL_NOT_FOUND));
        }
        // Buscar o perfil com suas funcionalidades usando FETCH JOIN
        // Isso garante que apenas funcionalidades realmente associadas ao perfil sejam retornadas
        Perfil perfilComFuncionalidades;
        try {
            perfilComFuncionalidades = entityManager.createQuery(
                "SELECT DISTINCT p FROM Perfil p " +
                "LEFT JOIN FETCH p.funcionalidades f " +
                "WHERE p.id = :perfilId", 
                Perfil.class
            ).setParameter("perfilId", perfilId).getSingleResult();
        } catch (jakarta.persistence.NoResultException e) {
            return List.of();
        }
        
        if (perfilComFuncionalidades == null || perfilComFuncionalidades.getFuncionalidades() == null) {
            return List.of();
        }
        
        // Filtrar apenas funcionalidades ativas e ordenar
        return perfilComFuncionalidades.getFuncionalidades().stream()
            .filter(f -> f.getAtivo() != null && f.getAtivo())
            .sorted((f1, f2) -> {
                Integer ordem1 = f1.getOrdem() != null ? f1.getOrdem() : 0;
                Integer ordem2 = f2.getOrdem() != null ? f2.getOrdem() : 0;
                return ordem1.compareTo(ordem2);
            })
            .collect(java.util.stream.Collectors.toList());
    }
}
