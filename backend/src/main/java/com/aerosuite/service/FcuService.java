package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import org.jboss.logging.Logger;
import com.aerosuite.domain.TenantConstants;

import com.aerosuite.domain.Fcu;
import com.aerosuite.dto.FcuDto;
import com.aerosuite.mapping.FcuMapper;
import com.aerosuite.repository.FcuRepository;
import com.aerosuite.security.TenantDataAccess;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.persistence.PersistenceException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.StringJoiner;

@ApplicationScoped
public class FcuService {

    private static final Logger LOG = Logger.getLogger(FcuService.class);
    private static final int MAX_PAGE_SIZE = 200;
    @Inject 
    FcuMapper mapper;
    
    @Inject
    FcuRepository repository;

    @Inject
    TenantDataAccess tenantDataAccess;

    private long tid() {
        return tenantDataAccess.currentTenantId();
    }

    private Fcu requireFcu(Long id) {
        Fcu entity = repository.findById(id);
        if (entity == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.FCU_NOT_FOUND_GENERIC));
        }
        return entity;
    }

    public FcuDto getById(Long id) {
        Fcu entity = Fcu.find("id = ?1 and isActive = ?2", id, true).firstResult();
        return entity != null ? mapper.toDto(entity) : null;
    }
    
    public FcuDto getByIdIncludingInactive(Long id) {
        Fcu entity = repository.findById(id);
        return entity != null ? mapper.toDto(entity) : null;
    }

    /** Lote para listagem de OS (evita N+1 no mapper). */
    public Map<Integer, FcuDto> findActiveByIds(Set<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<Fcu> entities = Fcu.find("id in ?1 and isActive = ?2", ids, true).list();
        if (entities == null || entities.isEmpty()) {
            return Map.of();
        }
        Map<Integer, FcuDto> out = new HashMap<>();
        for (Fcu entity : entities) {
            if (entity != null && entity.id != null) {
                out.put(entity.id, mapper.toDto(entity));
            }
        }
        return out;
    }

    public record SearchResult(List<FcuDto> items, long total) {}

    public SearchResult search(Integer page, Integer size, String sort, String q, Boolean isActive) {
        int p = page != null && page >= 0 ? page : 0;
        int capped = size != null && size > 0 ? Math.min(size, MAX_PAGE_SIZE) : 10;
        int s = capped;

        Sort sortObj = Sort.by("id").ascending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            boolean desc = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        StringJoiner where = new StringJoiner(" and ");
        Map<String, Object> params = new HashMap<>();

        // Filtrar apenas ativos por padrão (se isActive não for especificado ou for true)
        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }

        if (q != null && !q.isBlank()) {
            where.add("(LOWER(fcuCodigo) like :q or LOWER(fcuDescription) like :q or LOWER(modelo) like :q or LOWER(pn) like :q or LOWER(serialNumber) like :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        String queryString = where.length() > 0 ? where.toString() : "1=1";
        PanacheQuery<Fcu> query = repository.findWithFilters(queryString, sortObj, params);

        long total = query.count();
        List<FcuDto> items = query.page(io.quarkus.panache.common.Page.of(p, s)).list().stream()
                .map(entity -> mapper.toDto((Fcu) entity))
                .toList();

        return new SearchResult(items, total);
    }

    @Transactional
    public FcuDto create(FcuDto dto) {
        Fcu entity = mapper.toEntity(dto);
        // Garantir que novos registros sejam sempre ativos
        if (entity.isActive == null) {
            entity.isActive = true;
        }
        entity.tenantId = TenantConstants.tenantIdOf(tid());
        repository.persist(entity);
        return mapper.toDto(entity);
    }

    @Transactional
    public FcuDto update(Long id, FcuDto dto) {
        
        Fcu entity = requireFcu(id);


        // Se o DTO contém isActive=false, fazer soft delete (inativar)
        // Verificar se é apenas uma requisição de inativação (DTO parcial com apenas isActive)
        if (dto != null && dto.isActive() != null && !dto.isActive()) {
            
            // Usar UPDATE direto para evitar problemas com validação de campos obrigatórios
            try {
                int updated = Fcu.update("isActive = ?1 where id = ?2", false, id);
                
                if (updated == 0) {
                    throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.FCU_DEACTIVATE_NO_ROWS));
                }
                
                // Recarregar a entidade após o UPDATE
                entity = requireFcu(id);
                
            } catch (Exception e) {
                LOG.warnf(e, "FcuService.update - ERRO ao executar UPDATE: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
                throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_DEACTIVATE_FAILED, e.getMessage()), e);
            }
            try {
                FcuDto result = mapper.toDto(entity);
                return result;
            } catch (Exception e) {
                LOG.warnf(e, "FcuService.update - ERRO ao converter para DTO: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
                throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_DTO_CONVERT_FAILED, e.getMessage()), e);
            }
        }

        // Caso contrário, atualizar normalmente
        // Verificar se o DTO tem campos válidos antes de atualizar
        if (dto != null) {
            boolean hasValidFields = dto.fcuCodigo() != null || dto.fcuDescription() != null || 
                                     dto.modelo() != null || dto.pn() != null || 
                                     dto.serialNumber() != null || dto.idProduct() != null ||
                                     dto.idFabricante() != null;
            
            if (hasValidFields) {
                // Salvar o valor atual de isActive antes do update
                Boolean currentIsActive = entity.isActive;
                try {
                    mapper.updateEntity(dto, entity);
                    // Restaurar o valor de isActive (não permitir alterar diretamente pelo update normal)
                    entity.isActive = currentIsActive;
                    // fcuCodigo não é obrigatório, pode ser null ou vazio
                    // Como a entidade já está sendo gerenciada, apenas fazer flush
                    repository.flush();
                } catch (Exception e) {
                    LOG.warnf(e, "FcuService.update - ERRO ao atualizar campos: %s", e.getMessage());
                    LOG.warnf(e, "Erro inesperado");
                    throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_UPDATE_FIELDS_FAILED, e.getMessage()), e);
                }
            } else {
            }
        }
        
        try {
            FcuDto result = mapper.toDto(entity);
            return result;
        } catch (Exception e) {
            LOG.warnf(e, "FcuService.update - ERRO ao converter para DTO final: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_DTO_CONVERT_FAILED, e.getMessage()), e);
        }
    }

    @Transactional
    public FcuDto delete(Long id) {
        if (id == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FCU_ID_REQUIRED));
        }
        
        
        // Verificar se o FCU existe antes de tentar inativar
        boolean exists = repository.existsById(id);
        if (!exists) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.FCU_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        // Soft delete - usar UPDATE direto pelo ID para evitar problemas com validação de campos obrigatórios
        try {
            int updated = Fcu.update("isActive = ?1 where id = ?2", false, id);
            
            if (updated == 0) {
                // Pode já estar inativo, verificar
                Fcu check = repository.findById(id);
                if (check != null && check.isActive != null && !check.isActive) {
                    return mapper.toDto(check);
                }
                throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.FCU_DEACTIVATE_NO_ROWS_SIMPLE));
            }
            
            // Recarregar a entidade após o UPDATE para retornar o DTO atualizado
            Fcu fcu = requireFcu(id);
            
            
            FcuDto result = mapper.toDto(fcu);
            return result;
        } catch (Exception e) {
            LOG.warnf(e, "FcuService.delete - ERRO ao executar UPDATE: %s", e.getMessage());
            if (e.getCause() != null) {
                LOG.warnf(e, "FcuService.delete - Causa: %s", e.getCause().getMessage());
            }
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_DEACTIVATE_FAILED, e.getMessage()), e);
        }
    }
    
    @Transactional
    public FcuDto inactivate(Long id) {
        return delete(id); // Alias para delete (soft delete)
    }
}
