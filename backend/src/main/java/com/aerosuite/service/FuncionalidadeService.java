package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.dto.FuncionalidadeDTO;
import com.aerosuite.model.Funcionalidade;
import com.aerosuite.model.Perfil;
import com.aerosuite.domain.Usuario;
import com.aerosuite.p1.TenantModuleCatalog;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.PermissionProfileService;
import com.aerosuite.security.SupplementalPermissionSource;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import org.hibernate.Hibernate;
import org.jboss.logging.Logger;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class FuncionalidadeService {

    private static final Logger LOG = Logger.getLogger(FuncionalidadeService.class);
    
    @Inject
    EntityManager entityManager;

    @Inject
    PermissionProfileService permissionProfileService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    SupplementalPermissionSource supplementalPermissionSource;
    
    public List<Funcionalidade> listarTodas() {
        return entityManager.createQuery(
            "SELECT f FROM Funcionalidade f WHERE f.ativo = true ORDER BY f.ordem ASC", 
            Funcionalidade.class
        ).getResultList();
    }

    /** Funcionalidades atribuíveis na matriz RBAC do tenant. */
    public List<Funcionalidade> listarParaGestaoRbac() {
        return entityManager.createQuery(
            "SELECT f FROM Funcionalidade f WHERE f.ativo = true AND (f.gestaoRbac = true OR f.gestaoRbac IS NULL) ORDER BY f.ordem ASC",
            Funcionalidade.class
        ).getResultList();
    }
    
    public Funcionalidade buscarPorId(Long id) {
        return entityManager.find(Funcionalidade.class, id);
    }
    
    @Transactional
    public Funcionalidade criar(FuncionalidadeDTO dto) {
        Funcionalidade funcionalidade = new Funcionalidade();
        funcionalidade.setNome(dto.getNome());
        funcionalidade.setDescricao(dto.getDescricao());
        funcionalidade.setCodigo(dto.getCodigo());
        funcionalidade.setIcone(dto.getIcone());
        funcionalidade.setRota(dto.getRota());
        funcionalidade.setOrdem(dto.getOrdem());
        funcionalidade.setSecao(dto.getSecao() != null ? dto.getSecao() : "Sistema");
        funcionalidade.setParentId(dto.getParentId());
        funcionalidade.setTipo(dto.getTipo() != null ? dto.getTipo() : com.aerosuite.model.TipoFuncionalidade.funcionalidade);
        funcionalidade.setVisivel(dto.getVisivel() != null ? dto.getVisivel() : true);
        funcionalidade.setCorIcone(dto.getCorIcone());
        funcionalidade.setPosicao(dto.getPosicao() != null ? dto.getPosicao() : 0);
        funcionalidade.setAtivo(dto.getAtivo() != null ? dto.getAtivo() : true);
        
        entityManager.persist(funcionalidade);
        return funcionalidade;
    }
    
    @Transactional
    public Funcionalidade atualizar(Long id, FuncionalidadeDTO dto) {
        Funcionalidade funcionalidade = buscarPorId(id);
        if (funcionalidade == null) {
            return null;
        }
        
        funcionalidade.setNome(dto.getNome());
        funcionalidade.setDescricao(dto.getDescricao());
        funcionalidade.setCodigo(dto.getCodigo());
        funcionalidade.setIcone(dto.getIcone());
        funcionalidade.setRota(dto.getRota());
        funcionalidade.setOrdem(dto.getOrdem());
        funcionalidade.setSecao(dto.getSecao());
        funcionalidade.setParentId(dto.getParentId());
        funcionalidade.setTipo(dto.getTipo());
        funcionalidade.setVisivel(dto.getVisivel());
        funcionalidade.setCorIcone(dto.getCorIcone());
        funcionalidade.setPosicao(dto.getPosicao());
        funcionalidade.setAtivo(dto.getAtivo());
        
        return entityManager.merge(funcionalidade);
    }

    @Transactional
    public boolean deletar(Long id) {
        Funcionalidade funcionalidade = buscarPorId(id);
        if (funcionalidade == null) {
            return false;
        }

        // Soft delete - apenas marca como inativo
        funcionalidade.setAtivo(false);
        entityManager.merge(funcionalidade);
        return true;
    }


    public List<Funcionalidade> listarPorPerfil(Long perfilId) {
        // Usar SQL nativo para garantir que buscamos diretamente do banco, sem cache
        // Isso evita problemas com cache do Hibernate/JPA
        @SuppressWarnings("unchecked")
        List<Object> funcionalidadeIdsRaw = entityManager.createNativeQuery(
            "SELECT DISTINCT f.id " +
            "FROM funcionalidade f " +
            "INNER JOIN perfil_funcionalidade pf ON f.id = pf.funcionalidade_id " +
            "WHERE pf.perfil_id = :perfilId " +
            "AND f.ativo = TRUE"
        )
        .setParameter("perfilId", perfilId)
        .getResultList();
        
        if (funcionalidadeIdsRaw == null || funcionalidadeIdsRaw.isEmpty()) {
            LOG.debugf("FuncionalidadeService.listarPorPerfil - Perfil ID: %s, Nenhuma funcionalidade encontrada na tabela perfil_funcionalidade", perfilId);
            return List.of();
        }
        
        // Converter para List<Long>
        List<Long> funcionalidadeIds = funcionalidadeIdsRaw.stream()
            .map(id -> {
                if (id instanceof Number) {
                    return ((Number) id).longValue();
                }
                return Long.parseLong(id.toString());
            })
            .collect(java.util.stream.Collectors.toList());
        
        // Buscar as funcionalidades pelos IDs encontrados
        // Usar uma query separada para evitar problemas com cache
        List<Funcionalidade> funcionalidades = entityManager.createQuery(
            "SELECT f FROM Funcionalidade f " +
            "WHERE f.id IN :ids " +
            "AND f.ativo = true " +
            "ORDER BY f.secao, f.posicao",
            Funcionalidade.class
        )
        .setParameter("ids", funcionalidadeIds)
        .setHint("jakarta.persistence.cache.retrieveMode", jakarta.persistence.CacheRetrieveMode.BYPASS)
        .setHint("jakarta.persistence.cache.storeMode", jakarta.persistence.CacheStoreMode.BYPASS)
        .getResultList();
        
        LOG.debugf("FuncionalidadeService.listarPorPerfil - Perfil ID: %s, Funcionalidades encontradas: %d",
                String.valueOf(perfilId), funcionalidades.size());
        
        return funcionalidades;
    }

    /**
     * Lista funcionalidades por usuário baseado no perfil do usuário
     */
    public List<Funcionalidade> listarPorUsuario(Long usuarioId) {
        return entityManager.createQuery(
            "SELECT f FROM Usuario u " +
            "JOIN u.perfil p " +
            "JOIN p.funcionalidades f " +
            "WHERE u.id = :usuarioId " +
            "AND f.ativo = true " +
            "AND f.visivel = true " +
            "ORDER BY f.secao, f.posicao",
            Funcionalidade.class
        ).setParameter("usuarioId", usuarioId.intValue()).getResultList();
    }

    /**
     * Menu efetivo (perfil via {@link #listarPorPerfil} + delegações) — padrão Bellows, uma query
     * indexada por perfil em vez de snapshot + IN em todos os códigos.
     */
    public List<Funcionalidade> listarMenuEfetivoPorUsuarioId(int usuarioId) {
        Usuario usuario = Usuario.find(
                "SELECT DISTINCT u FROM Usuario u LEFT JOIN FETCH u.perfil p WHERE u.id = ?1",
                usuarioId).firstResult();
        if (usuario == null) {
            return List.of();
        }
        return listarMenuEfetivoParaUsuario(usuario);
    }

    /** Menu para login / sessão — reutiliza perfil já carregado quando disponível. */
    public List<FuncionalidadeDTO> listarMenuDtoEfetivoParaUsuario(Usuario usuario, Set<String> enabledModules) {
        return listarMenuEfetivoParaUsuario(usuario).stream()
                .filter(f -> enabledModules == null
                        || enabledModules.isEmpty()
                        || TenantModuleCatalog.isFuncionalidadeAllowed(enabledModules, f.getCodigo()))
                .map(this::converterParaDto)
                .collect(Collectors.toList());
    }

    private List<Funcionalidade> listarMenuEfetivoParaUsuario(Usuario usuario) {
        if (usuario == null || usuario.id == null) {
            return List.of();
        }
        List<Funcionalidade> menu = new ArrayList<>();
        Perfil perfil = usuario.perfil;
        if (perfil != null && perfil.getId() != null && Boolean.TRUE.equals(perfil.getAtivo())) {
            if (perfil.getFuncionalidades() != null && Hibernate.isInitialized(perfil.getFuncionalidades())) {
                for (Funcionalidade f : perfil.getFuncionalidades()) {
                    if (f != null
                            && Boolean.TRUE.equals(f.getAtivo())
                            && Boolean.TRUE.equals(f.getVisivel())) {
                        menu.add(f);
                    }
                }
            } else {
                menu.addAll(listarPorUsuario(usuario.id.longValue()));
            }
        }
        Set<String> have = menu.stream()
                .map(Funcionalidade::getCodigo)
                .filter(Objects::nonNull)
                .map(c -> c.trim().toUpperCase(Locale.ROOT))
                .collect(Collectors.toCollection(HashSet::new));
        Set<String> extras = supplementalPermissionSource.extraFuncionalidadeCodigosForUser(usuario.id);
        if (extras != null && !extras.isEmpty()) {
            Set<String> missing = extras.stream()
                    .filter(Objects::nonNull)
                    .map(c -> c.trim().toUpperCase(Locale.ROOT))
                    .filter(c -> !c.isEmpty() && !have.contains(c))
                    .collect(Collectors.toSet());
            if (!missing.isEmpty()) {
                menu.addAll(listarPorCodigos(missing));
            }
        }
        return menu.stream()
                .filter(f -> Boolean.TRUE.equals(f.getAtivo()) && Boolean.TRUE.equals(f.getVisivel()))
                .collect(Collectors.toList());
    }

    private List<Funcionalidade> listarPorCodigos(Set<String> upperCodes) {
        if (upperCodes == null || upperCodes.isEmpty()) {
            return List.of();
        }
        return entityManager.createQuery(
                        "SELECT f FROM Funcionalidade f WHERE UPPER(TRIM(f.codigo)) IN :codes "
                                + "AND f.ativo = true AND f.visivel = true ORDER BY f.secao, f.posicao",
                        Funcionalidade.class)
                .setParameter("codes", upperCodes)
                .getResultList();
    }

    private FuncionalidadeDTO converterParaDto(Funcionalidade funcionalidade) {
        FuncionalidadeDTO dto = new FuncionalidadeDTO();
        dto.setId(funcionalidade.getId());
        dto.setNome(funcionalidade.getNome());
        dto.setDescricao(funcionalidade.getDescricao());
        dto.setCodigo(funcionalidade.getCodigo());
        dto.setIcone(funcionalidade.getIcone());
        dto.setRota(funcionalidade.getRota());
        dto.setOrdem(funcionalidade.getOrdem());
        dto.setSecao(funcionalidade.getSecao());
        dto.setParentId(funcionalidade.getParentId());
        dto.setTipo(funcionalidade.getTipo());
        dto.setVisivel(funcionalidade.getVisivel());
        dto.setCorIcone(funcionalidade.getCorIcone());
        dto.setPosicao(funcionalidade.getPosicao());
        dto.setAtivo(funcionalidade.getAtivo());
        dto.setCreatedAt(funcionalidade.getCreatedAt());
        dto.setUpdatedAt(funcionalidade.getUpdatedAt());
        return dto;
    }
    
    public List<Funcionalidade> listarPorSecao(String secao) {
        return entityManager.createQuery(
            "SELECT f FROM Funcionalidade f " +
            "WHERE f.secao = :secao AND f.ativo = true AND f.visivel = true " +
            "ORDER BY f.posicao",
            Funcionalidade.class
        )
        .setParameter("secao", secao)
        .getResultList();
    }
    
    public List<Funcionalidade> listarParaMenu() {
        return entityManager.createQuery(
            "SELECT f FROM Funcionalidade f " +
            "WHERE f.ativo = true AND f.visivel = true " +
            "ORDER BY f.secao, f.posicao",
            Funcionalidade.class
        )
        .getResultList();
    }
    
    public List<String> listarSecoes() {
        return entityManager.createQuery(
            "SELECT DISTINCT f.secao FROM Funcionalidade f " +
            "WHERE f.ativo = true AND f.visivel = true " +
            "ORDER BY f.secao",
            String.class
        )
        .getResultList();
    }
    
    @Transactional
    public void atribuirFuncionalidades(Long perfilId, Set<Long> funcionalidadeIds) {
        Perfil perfil = entityManager.find(Perfil.class, perfilId);
        if (perfil == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.USER_PROFILE_NOT_FOUND_GENERIC));
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
}
