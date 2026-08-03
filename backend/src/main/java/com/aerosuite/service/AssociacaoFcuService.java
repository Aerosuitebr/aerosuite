package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.TenantConstants;

import com.aerosuite.domain.AssociacaoFcu;
import com.aerosuite.domain.Fcu;
import com.aerosuite.domain.Product;
import com.aerosuite.dto.AssociacaoFcuDto;
import com.aerosuite.mapping.AssociacaoFcuMapper;
import com.aerosuite.security.TenantDataAccess;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.*;

@ApplicationScoped
public class AssociacaoFcuService {
    @Inject AssociacaoFcuMapper mapper;
    @Inject TenantDataAccess tenantDataAccess;

    private long tid() {
        return tenantDataAccess.currentTenantId();
    }

    private void assertFcuInTenant(Long idFcu) {
        if (idFcu == null || Fcu.count("id = ?1", idFcu) == 0) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FCU_NOT_FOUND, "id", String.valueOf(idFcu)));
        }
    }

    private void assertProductInTenant(Integer idProduct) {
        if (idProduct == null || Product.count("id = ?1", idProduct) == 0) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.PRODUCT_NOT_FOUND, "id", String.valueOf(idProduct)));
        }
    }

    private AssociacaoFcu requireAssociacao(Integer id) {
        AssociacaoFcu entity = AssociacaoFcu.find("id = ?1", id).firstResult();
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.ASSOCIACAO_FCU_NOT_FOUND, "id", String.valueOf(id)));
        }
        return entity;
    }

    public record SearchResult(List<AssociacaoFcuDto> items, long total) {}

    public SearchResult search(Integer page, Integer size, String sort, String q, Long idFcu, Boolean isActive) {
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? size : 10;

        Sort sortObj = Sort.by("id").ascending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            boolean desc = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        StringJoiner where = new StringJoiner(" and ");
        Map<String,Object> params = new HashMap<>();

        // Filtrar apenas associações ativas por padrão (se isActive não for especificado ou for true)
        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }

        if (idFcu != null) {
            where.add("idFcu = :idFcu");
            params.put("idFcu", idFcu);
        }

        if (q != null && !q.isBlank()) {
            where.add("(fcu.fcuCodigo like :q or fcu.fcuDescription like :q or product.name like :q or product.description like :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        String queryString = where.length() > 0 ? where.toString() : "1=1";
        PanacheQuery<AssociacaoFcu> query = AssociacaoFcu.find(queryString, sortObj, params);

        long total = query.count();
        List<AssociacaoFcuDto> items = query.page(Page.of(p, s)).<AssociacaoFcu>list().stream()
                .map(entity -> {
                    AssociacaoFcuDto dto = mapper.toDto(entity);
                    // Indicar se o produto está inativo
                    if (entity.product != null) {
                        dto.productIsActive = entity.product.isActive;
                    }
                    return dto;
                })
                .toList();
        
        return new SearchResult(items, total);
    }

    public List<AssociacaoFcuDto> getByFcuId(Long idFcu) {
        return AssociacaoFcu.find("idFcu = ?1 and isActive = ?2", idFcu, true).<AssociacaoFcu>list().stream()
                .map(entity -> {
                    AssociacaoFcuDto dto = mapper.toDto(entity);
                    // Indicar se o produto está inativo
                    if (entity.product != null) {
                        dto.productIsActive = entity.product.isActive;
                    }
                    return dto;
                })
                .toList();
    }

    public List<Product> getAvailableProducts(Long idFcu, String search) {
        if (idFcu == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.ASSOCIACAO_FCU_ID_REQUIRED));
        }
        
        // Buscar IDs dos produtos já associados a este FCU (apenas associações ativas)
        assertFcuInTenant(idFcu);
        List<Integer> associatedProductIds = AssociacaoFcu.find("idFcu = ?1 and isActive = ?2", idFcu, true)
                .<AssociacaoFcu>list()
                .stream()
                .map(af -> af.idProduct)
                .filter(id -> id != null)
                .toList();
        
        // Construir query base
        StringJoiner where = new StringJoiner(" AND ");
        Map<String, Object> params = new HashMap<>();
        
        // IMPORTANTE: Filtrar apenas produtos ATIVOS
        where.add("p.isActive = :isActive");
        params.put("isActive", true);
        
        // Se houver produtos associados, excluir eles
        if (!associatedProductIds.isEmpty()) {
            where.add("p.id NOT IN :associatedIds");
            params.put("associatedIds", associatedProductIds);
        }
        
        // Adicionar filtro de busca se fornecido
        if (search != null && !search.isBlank()) {
            where.add("(LOWER(p.name) like :search OR LOWER(p.description) like :search OR LOWER(p.productpn) like :search)");
            params.put("search", "%" + search.toLowerCase() + "%");
        }
        
        String queryString = where.length() > 0 ? where.toString() : "1=1";
        return Product.find("FROM Product p WHERE " + queryString, params).list();
    }

    @Transactional
    public AssociacaoFcuDto create(AssociacaoFcuDto dto) {
        AssociacaoFcu entity = mapper.toEntity(dto);
        // Garantir que novas associações sejam sempre ativas
        if (entity.isActive == null) {
            entity.isActive = true;
        }
        assertFcuInTenant(entity.idFcu);
        assertProductInTenant(entity.idProduct);
        entity.tenantId = TenantConstants.tenantIdOf(tid());
        entity.persist();
        AssociacaoFcuDto result = mapper.toDto(entity);
        // Indicar se o produto está inativo
        if (entity.product != null) {
            result.productIsActive = entity.product.isActive;
        }
        return result;
    }

    @Transactional
    public AssociacaoFcuDto update(Integer id, AssociacaoFcuDto dto) {
        AssociacaoFcu entity = requireAssociacao(id);
        
        // Se o DTO contém isActive=false, fazer soft delete (inativar)
        if (dto.isActive != null && !dto.isActive) {
            entity.isActive = false;
            AssociacaoFcuDto result = mapper.toDto(entity);
            if (entity.product != null) {
                result.productIsActive = entity.product.isActive;
            }
            return result;
        }
        
        // Caso contrário, atualizar normalmente
        // Salvar o valor atual de isActive antes do update
        Boolean currentIsActive = entity.isActive;
        entity.idFcu = dto.idFcu;
        entity.idProduct = dto.idProduct;
        entity.qtdProduct = dto.qtdProduct;
        // Restaurar o valor de isActive (não permitir alterar diretamente pelo update normal)
        entity.isActive = currentIsActive;
        
        AssociacaoFcuDto result = mapper.toDto(entity);
        // Indicar se o produto está inativo
        if (entity.product != null) {
            result.productIsActive = entity.product.isActive;
        }
        return result;
    }

    @Transactional
    public AssociacaoFcuDto delete(Integer id) {
        AssociacaoFcu entity = requireAssociacao(id);
        
        // Soft delete - inativar ao invés de deletar fisicamente
        entity.isActive = false;
        AssociacaoFcuDto result = mapper.toDto(entity);
        // Indicar se o produto está inativo
        if (entity.product != null) {
            result.productIsActive = entity.product.isActive;
        }
        return result;
    }
    
    @Transactional
    public AssociacaoFcuDto inactivate(Integer id) {
        return delete(id); // Alias para delete (soft delete)
    }

    @Transactional
    public void deleteByFcuAndProduct(Long idFcu, Integer idProduct) {
        AssociacaoFcu.delete("idFcu = ?1 and idProduct = ?2", idFcu, idProduct);
    }

    @Transactional
    public void associateProducts(Long idFcu, List<Integer> productIds, Integer defaultQuantity) {
        // Adiciona novas associações sem remover as existentes
        // Verifica se a associação já existe antes de criar
        assertFcuInTenant(idFcu);
        for (Integer productId : productIds) {
            assertProductInTenant(productId);
            AssociacaoFcu existing = AssociacaoFcu.find("idFcu = ?1 and idProduct = ?2", idFcu, productId).firstResult();
            
            if (existing == null) {
                AssociacaoFcu entity = new AssociacaoFcu();
                entity.idFcu = idFcu;
                entity.idProduct = productId;
                entity.qtdProduct = defaultQuantity != null ? defaultQuantity : 1;
                entity.isActive = true;
                entity.tenantId = TenantConstants.tenantIdOf(tid());
                entity.persist();
            } else {
                // Se já existe, reativar se estiver inativa e atualizar quantidade
                if (existing.isActive == null || !existing.isActive) {
                    // Reativar associação inativa
                    existing.isActive = true;
                }
                
                // Atualizar quantidade se necessário
                if (defaultQuantity != null && !defaultQuantity.equals(existing.qtdProduct)) {
                    existing.qtdProduct = defaultQuantity;
                }
            }
        }
    }
}
