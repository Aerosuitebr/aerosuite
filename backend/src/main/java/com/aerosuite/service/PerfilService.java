package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.PerfilDTO;
import com.aerosuite.model.Perfil;
import com.aerosuite.model.Funcionalidade;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import java.util.List;

@ApplicationScoped
public class PerfilService {
    
    @Inject
    EntityManager entityManager;
    
    public List<Perfil> listarTodos() {
        return entityManager.createQuery(
            "SELECT p FROM Perfil p WHERE p.ativo = true ORDER BY p.nome ASC", 
            Perfil.class
        ).getResultList();
    }

    /** Perfis visíveis na matriz RBAC do tenant (exclui perfis ocultos do plano de controle). */
    public List<Perfil> listarParaGestaoRbac() {
        return entityManager.createQuery(
            "SELECT p FROM Perfil p WHERE p.ativo = true AND (p.oculto = false OR p.oculto IS NULL) ORDER BY p.nome ASC",
            Perfil.class
        ).getResultList();
    }
    
    public Perfil buscarPorId(Long id) {
        return entityManager.find(Perfil.class, id);
    }
    
    @Transactional
    public Perfil criar(PerfilDTO dto) {
        Perfil perfil = new Perfil();
        perfil.setNome(dto.getNome());
        perfil.setDescricao(dto.getDescricao());
        perfil.setCodigo(dto.getCodigo());
        perfil.setAtivo(dto.getAtivo() != null ? dto.getAtivo() : true);
        
        entityManager.persist(perfil);
        return perfil;
    }
    
    @Transactional
    public Perfil atualizar(Long id, PerfilDTO dto) {
        Perfil perfil = buscarPorId(id);
        if (perfil == null) {
            return null;
        }
        
        perfil.setNome(dto.getNome());
        perfil.setDescricao(dto.getDescricao());
        perfil.setCodigo(dto.getCodigo());
        perfil.setAtivo(dto.getAtivo());
        
        return entityManager.merge(perfil);
    }

    @Transactional
    public boolean deletar(Long id) {
        Perfil perfil = buscarPorId(id);
        if (perfil == null) {
            return false;
        }
        // Soft delete - apenas marca como inativo
        perfil.setAtivo(false);
        entityManager.merge(perfil);
        return true;
    }

    @Transactional
    public void atribuirFuncionalidades(Long perfilId, List<Long> funcionalidadeIds) {
        Perfil perfil = entityManager.find(Perfil.class, perfilId);
        if (perfil == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.PERFIL_NOT_FOUND));
        }
        
        // Limpar funcionalidades existentes
        perfil.getFuncionalidades().clear();
        
        // Adicionar novas funcionalidades
        if (funcionalidadeIds != null && !funcionalidadeIds.isEmpty()) {
            List<Funcionalidade> funcionalidades = entityManager.createQuery(
                "SELECT f FROM Funcionalidade f WHERE f.id IN :ids AND f.ativo = true", 
                Funcionalidade.class
            ).setParameter("ids", funcionalidadeIds).getResultList();
            
            perfil.getFuncionalidades().addAll(funcionalidades);
        }
        
        entityManager.merge(perfil);
    }
    
    public List<Funcionalidade> listarFuncionalidades(Long perfilId) {
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
