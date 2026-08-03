package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import org.jboss.logging.Logger;
import com.aerosuite.domain.Fcu;
import com.aerosuite.domain.PublicacaoProduto;
import com.aerosuite.domain.PublicacaoTecnica;
import com.aerosuite.dto.PublicacaoProdutoDto;
import com.aerosuite.mapping.PublicacaoProdutoMapper;
import com.aerosuite.security.TenantDataAccess;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.*;

@ApplicationScoped
public class PublicacaoProdutoService {

    private static final Logger LOG = Logger.getLogger(PublicacaoProdutoService.class);
    @Inject PublicacaoProdutoMapper mapper;
    @Inject TenantDataAccess tenantDataAccess;

    public record SearchResult(List<PublicacaoProdutoDto> items, long total) {}

    @Transactional
    public SearchResult search(Integer page, Integer size, String sort, String q, Integer publicacaoId, Boolean isActive) {
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? size : 10;

        Sort sortObj = Sort.by("id").descending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            boolean desc = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        StringJoiner where = new StringJoiner(" and ");
        Map<String,Object> params = new HashMap<>();

        // Filtrar apenas associações ativas por padrão
        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }

        if (publicacaoId != null) {
            where.add("publicacaoId = :publicacaoId");
            params.put("publicacaoId", publicacaoId);
        }

        if (q != null && !q.isBlank()) {
            where.add("(lower(fcu.fcuDescription) like :q or lower(fcu.fcuCodigo) like :q or lower(fcu.pn) like :q or lower(fcu.modelo) like :q or lower(publicacao.ataManual) like :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        String queryString = where.length() > 0 ? where.toString() : "1=1";
        PanacheQuery<PublicacaoProduto> query = PublicacaoProduto.find(queryString, sortObj, params);

        long total = query.count();
        List<PublicacaoProdutoDto> items = query.page(Page.of(p, s)).<PublicacaoProduto>list().stream()
                .map(entity -> {
                    PublicacaoProdutoDto dto = mapper.toDto(entity);
                    if (entity.fcu != null) {
                        dto.fcuIsActive = entity.fcu.isActive;
                    }
                    return dto;
                })
                .toList();
        
        return new SearchResult(items, total);
    }

    @Transactional
    public List<PublicacaoProdutoDto> getByPublicacaoId(Integer publicacaoId) {
        try {
            List<PublicacaoProduto> entities = PublicacaoProduto.find("publicacaoId = ?1 and isActive = ?2", publicacaoId, true).list();
            return entities.stream()
                    .map(entity -> {
                        PublicacaoProdutoDto dto = new PublicacaoProdutoDto();
                        dto.id = entity.id;
                        dto.publicacaoId = entity.publicacaoId;
                        dto.fcuId = entity.fcuId;
                        dto.isActive = entity.isActive;
                        dto.createdAt = entity.createdAt;
                        dto.updatedAt = entity.updatedAt;
                        dto.createdBy = entity.createdBy;
                        
                        // Carregar dados do FCU se existir
                        if (entity.fcu != null) {
                            dto.fcuCodigo = entity.fcu.fcuCodigo;
                            dto.fcuDescription = entity.fcu.fcuDescription;
                            dto.fcuModelo = entity.fcu.modelo;
                            dto.fcuPn = entity.fcu.pn;
                            dto.fcuSerialNumber = entity.fcu.serialNumber;
                            dto.fcuAtaManual = entity.fcu.ataManual;
                            dto.fcuDataRevManual = entity.fcu.dataRevManual;
                            dto.fcuNumRevisao = entity.fcu.numRevisao;
                            dto.fcuIsActive = entity.fcu.isActive;
                        }
                        
                        // Carregar dados da Publicação se existir
                        if (entity.publicacao != null) {
                            dto.publicacaoAtaManual = entity.publicacao.ataManual;
                            dto.publicacaoNumeroRevisao = entity.publicacao.numeroRevisao;
                            dto.publicacaoTipoManual = entity.publicacao.tipoManual;
                            if (entity.publicacao.fabricante != null) {
                                dto.fabricanteNome = entity.publicacao.fabricante.nome;
                            }
                        }
                        
                        return dto;
                    })
                    .toList();
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao buscar associações: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return new ArrayList<>();
        }
    }

    @Transactional
    public List<Fcu> getAvailableFcus(Integer publicacaoId, String search) {
        try {
            if (publicacaoId == null) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_ID_REQUIRED));
            }
            
            // Buscar IDs dos FCUs já associados a esta publicação (apenas associações ativas)
            List<Integer> associatedFcuIds = new ArrayList<>();
            try {
                associatedFcuIds = PublicacaoProduto.find("publicacaoId = ?1 and isActive = ?2", publicacaoId, true)
                        .<PublicacaoProduto>list()
                        .stream()
                        .map(pp -> pp.fcuId)
                        .filter(Objects::nonNull)
                        .toList();
            } catch (Exception e) {
                LOG.warnf(e, "Aviso: Erro ao buscar associações existentes: %s", e.getMessage());
                // Continuar sem filtrar associados
            }
            
            // Construir query base - Buscar todos os FCUs não associados
            StringBuilder query = new StringBuilder("FROM Fcu f WHERE 1=1");
            Map<String, Object> params = new HashMap<>();
            
            // Se houver FCUs associados, excluir eles
            if (!associatedFcuIds.isEmpty()) {
                query.append(" AND f.id NOT IN :associatedIds");
                params.put("associatedIds", associatedFcuIds);
            }
            
            // Adicionar filtro de busca se fornecido
            if (search != null && !search.isBlank()) {
                query.append(" AND (LOWER(f.fcuDescription) like :search OR LOWER(f.fcuCodigo) like :search OR LOWER(f.pn) like :search OR LOWER(f.modelo) like :search)");
                params.put("search", "%" + search.toLowerCase() + "%");
            }
            
            return Fcu.find(query.toString(), params).list();
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao buscar FCUs disponíveis: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return new ArrayList<>();
        }
    }

    @Transactional
    public List<PublicacaoTecnica> getAvailablePublicacoes(Integer fcuId, String search) {
        if (fcuId == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_FCU_ID_REQUIRED));
        }
        
        // Buscar IDs das publicações já associadas a este FCU (apenas associações ativas)
        List<Integer> associatedPublicacaoIds = PublicacaoProduto.find("fcuId = ?1 and isActive = ?2", fcuId, true)
                .<PublicacaoProduto>list()
                .stream()
                .map(pp -> pp.publicacaoId)
                .filter(Objects::nonNull)
                .toList();
        
        // Construir query base
        StringJoiner where = new StringJoiner(" AND ");
        Map<String, Object> params = new HashMap<>();
        
        // Filtrar apenas publicações ATIVAS
        where.add("p.isActive = :isActive");
        params.put("isActive", true);
        
        // Se houver publicações associadas, excluir elas
        if (!associatedPublicacaoIds.isEmpty()) {
            where.add("p.id NOT IN :associatedIds");
            params.put("associatedIds", associatedPublicacaoIds);
        }
        
        // Adicionar filtro de busca se fornecido
        if (search != null && !search.isBlank()) {
            where.add("(LOWER(p.ataManual) like :search OR LOWER(p.numeroRevisao) like :search OR LOWER(p.tipoManual) like :search)");
            params.put("search", "%" + search.toLowerCase() + "%");
        }
        
        String queryString = where.length() > 0 ? where.toString() : "1=1";
        return PublicacaoTecnica.find("FROM PublicacaoTecnica p WHERE " + queryString, params).list();
    }

    @Transactional
    public PublicacaoProdutoDto create(PublicacaoProdutoDto dto) {
        PublicacaoProduto entity = mapper.toEntity(dto);
        if (entity.isActive == null) {
            entity.isActive = true;
        }
        entity.persist();
        PublicacaoProdutoDto result = mapper.toDto(entity);
        if (entity.fcu != null) {
            result.fcuIsActive = entity.fcu.isActive;
        }
        return result;
    }

    @Transactional
    public PublicacaoProdutoDto delete(Integer id) {
        PublicacaoProduto entity = PublicacaoProduto.findById(id);
        if (entity == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.ASSOCIACAO_NOT_FOUND));
        }
        // Soft delete
        entity.isActive = false;
        PublicacaoProdutoDto result = mapper.toDto(entity);
        if (entity.fcu != null) {
            result.fcuIsActive = entity.fcu.isActive;
        }
        return result;
    }

    @Transactional
    public void deleteByPublicacaoAndFcu(Integer publicacaoId, Integer fcuId) {
        PublicacaoProduto.delete("publicacaoId = ?1 and fcuId = ?2", publicacaoId, fcuId);
    }

    /**
     * Busca a publicação técnica associada a um FCU específico
     * Retorna a primeira publicação ativa encontrada ou null se não houver associação
     */
    @Transactional
    public PublicacaoProdutoDto getPublicacaoByFcuId(Integer fcuId) {
        try {
            if (fcuId == null) {
                return null;
            }
            
            // Buscar a associação ativa do FCU com uma publicação
            PublicacaoProduto associacao = PublicacaoProduto
                    .find("fcuId = ?1 and isActive = ?2", fcuId, true)
                    .firstResult();
            
            if (associacao == null) {
                return null;
            }
            
            // Construir o DTO com os dados da publicação
            PublicacaoProdutoDto dto = new PublicacaoProdutoDto();
            dto.id = associacao.id;
            dto.publicacaoId = associacao.publicacaoId;
            dto.fcuId = associacao.fcuId;
            dto.isActive = associacao.isActive;
            dto.createdAt = associacao.createdAt;
            dto.updatedAt = associacao.updatedAt;
            dto.createdBy = associacao.createdBy;
            
            // Carregar dados do FCU
            if (associacao.fcu != null) {
                dto.fcuCodigo = associacao.fcu.fcuCodigo;
                dto.fcuDescription = associacao.fcu.fcuDescription;
                dto.fcuModelo = associacao.fcu.modelo;
                dto.fcuPn = associacao.fcu.pn;
                dto.fcuSerialNumber = associacao.fcu.serialNumber;
                dto.fcuAtaManual = associacao.fcu.ataManual;
                dto.fcuDataRevManual = associacao.fcu.dataRevManual;
                dto.fcuNumRevisao = associacao.fcu.numRevisao;
                dto.fcuIsActive = associacao.fcu.isActive;
            }
            
            // Carregar dados da Publicação Técnica
            if (associacao.publicacao != null) {
                dto.publicacaoAtaManual = associacao.publicacao.ataManual;
                dto.publicacaoNumeroRevisao = associacao.publicacao.numeroRevisao;
                dto.publicacaoTipoManual = associacao.publicacao.tipoManual;
                // Adicionar data de revisão da publicação
                if (associacao.publicacao.dataRevisaoManual != null) {
                    dto.fcuDataRevManual = associacao.publicacao.dataRevisaoManual;
                }
                if (associacao.publicacao.fabricante != null) {
                    dto.fabricanteNome = associacao.publicacao.fabricante.nome;
                }
            }
            
            return dto;
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao buscar publicação por FCU: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return null;
        }
    }

    @Transactional
    public void associateFcus(Integer publicacaoId, List<Integer> fcuIds) {
        for (Integer fcuId : fcuIds) {
            // Verificar se já existe associação (ativa ou inativa)
            PublicacaoProduto existing = PublicacaoProduto.find("publicacaoId = ?1 and fcuId = ?2", publicacaoId, fcuId).firstResult();
            
            if (existing == null) {
                // Criar nova associação
                PublicacaoProduto entity = new PublicacaoProduto();
                entity.publicacaoId = publicacaoId;
                entity.fcuId = fcuId;
                entity.isActive = true;
                entity.persist();
            } else {
                // Reativar se inativa
                if (existing.isActive == null || !existing.isActive) {
                    existing.isActive = true;
                }
            }
        }
    }
}
