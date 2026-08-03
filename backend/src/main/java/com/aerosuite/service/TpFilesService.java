package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.TpFiles;
import com.aerosuite.dto.TpFilesDto;
import com.aerosuite.mapping.TpFilesMapper;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.stream.Collectors;

@ApplicationScoped
public class TpFilesService {
    
    private final TpFilesMapper mapper = TpFilesMapper.INSTANCE;
    
    public static class SearchResult {
        public List<TpFilesDto> items;
        public long totalElements;
        public int totalPages;
        public int page;
        public int size;
        public String sort;
        
        public SearchResult(List<TpFilesDto> items, long totalElements, int totalPages, int page, int size, String sort) {
            this.items = items;
            this.totalElements = totalElements;
            this.totalPages = totalPages;
            this.page = page;
            this.size = size;
            this.sort = sort;
        }
    }
    
    public SearchResult list(int page, int size, String sort, String q, Boolean isActive) {
        Sort sortObj = Sort.by("id").descending();
        
        if (sort != null && !sort.isEmpty()) {
            String[] sortParts = sort.split(",");
            if (sortParts.length == 2) {
                String field = sortParts[0];
                String direction = sortParts[1];
                sortObj = "asc".equalsIgnoreCase(direction) 
                    ? Sort.by(field).ascending() 
                    : Sort.by(field).descending();
            }
        }
        
        Page pageObj = Page.of(page, size);
        
        StringJoiner where = new StringJoiner(" AND ");
        Map<String, Object> params = new HashMap<>();
        
        // Filtrar apenas ativos por padrão (se isActive não for especificado ou for true)
        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }
        
        if (q != null && !q.trim().isEmpty()) {
            where.add("(LOWER(name) LIKE LOWER(:q))");
            params.put("q", "%" + q.trim() + "%");
        }
        
        String queryString = where.length() > 0 ? where.toString() : "1=1";
        List<TpFiles> entities = TpFiles.find(queryString, sortObj, params).page(pageObj).list();
        long totalElements = TpFiles.count(queryString, params);
        
        List<TpFilesDto> dtos = entities.stream()
            .map(mapper::toDto)
            .collect(Collectors.toList());
        
        int totalPages = (int) Math.ceil((double) totalElements / size);
        
        return new SearchResult(dtos, totalElements, totalPages, page, size, sort);
    }
    
    public TpFilesDto findById(Long id) {
        TpFiles entity = TpFiles.find("id = ?1 and isActive = ?2", id, true).firstResult();
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_NOT_FOUND, "id", String.valueOf(id)));
        }
        return mapper.toDto(entity);
    }
    
    @Transactional
    public TpFilesDto create(TpFilesDto dto) {
        TpFiles entity = mapper.toEntity(dto);
        // Garantir que novos registros sejam sempre ativos
        if (entity.isActive == null) {
            entity.isActive = true;
        }
        entity.persist();
        return mapper.toDto(entity);
    }
    
    @Transactional
    public TpFilesDto update(Long id, TpFilesDto dto) {
        TpFiles entity = TpFiles.findById(id);
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        // Se o DTO contém isActive=false, fazer soft delete (inativar)
        if (dto.isActive != null && !dto.isActive) {
            entity.isActive = false;
            return mapper.toDto(entity);
        }
        
        // Caso contrário, atualizar normalmente
        // Atualizar campos disponíveis - apenas o name está disponível na entidade
        if (dto.fileName != null) {
            entity.name = dto.fileName;
        }
        
        // Salvar o valor atual de isActive antes do update
        Boolean currentIsActive = entity.isActive;
        // Restaurar o valor de isActive (não permitir alterar diretamente pelo update normal)
        entity.isActive = currentIsActive;
        
        return mapper.toDto(entity);
    }
    
    @Transactional
    public TpFilesDto delete(Long id) {
        TpFiles entity = TpFiles.findById(id);
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        // Soft delete - inativar ao invés de deletar fisicamente
        entity.isActive = false;
        return mapper.toDto(entity);
    }
    
    public List<TpFilesDto> findByTipoServicoId(Integer tipoServicoId) {
        // Tabela atual não tem tipoServicoId, retornar lista vazia
        return List.of();
    }
    
    @Transactional
    public TpFilesDto inactivate(Long id) {
        return delete(id); // Alias para delete (soft delete)
    }
}
