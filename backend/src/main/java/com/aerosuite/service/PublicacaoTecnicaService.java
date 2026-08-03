package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.PublicacaoTecnica;
import com.aerosuite.dto.PublicacaoTecnicaDto;
import com.aerosuite.mapping.PublicacaoTecnicaMapper;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

import java.util.*;

@ApplicationScoped
public class PublicacaoTecnicaService {
    @Inject PublicacaoTecnicaMapper mapper;

    public record SearchResult(List<PublicacaoTecnicaDto> items, long total) {}

    public SearchResult search(Integer page, Integer size, String sort, String q, Integer fabricanteId, Boolean isActive) {
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

        // Filtrar apenas publicações ativas por padrão
        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }

        if (fabricanteId != null) {
            where.add("fabricanteId = :fabricanteId");
            params.put("fabricanteId", fabricanteId);
        }

        if (q != null && !q.isBlank()) {
            where.add("(lower(ataManual) like :q or lower(numeroRevisao) like :q or lower(tipoManual) like :q or lower(fabricante.nome) like :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        String queryString = where.length() > 0 ? where.toString() : "1=1";
        PanacheQuery<PublicacaoTecnica> query = PublicacaoTecnica.find(queryString, sortObj, params);

        long total = query.count();
        List<PublicacaoTecnicaDto> items = query.page(Page.of(p, s)).<PublicacaoTecnica>list().stream()
                .map(mapper::toDto)
                .toList();
        
        return new SearchResult(items, total);
    }

    public List<PublicacaoTecnicaDto> findAll() {
        return PublicacaoTecnica.find("isActive = ?1", true).<PublicacaoTecnica>list().stream()
                .map(mapper::toDto)
                .toList();
    }

    public PublicacaoTecnicaDto findById(Integer id) {
        PublicacaoTecnica entity = PublicacaoTecnica.findById(id);
        if (entity == null) {
            return null;
        }
        return mapper.toDto(entity);
    }

    @Transactional
    public PublicacaoTecnicaDto create(PublicacaoTecnicaDto dto) {
        PublicacaoTecnica entity = mapper.toEntity(dto);
        if (entity.isActive == null) {
            entity.isActive = true;
        }
        entity.persist();
        return mapper.toDto(entity);
    }

    @Transactional
    public PublicacaoTecnicaDto update(Integer id, PublicacaoTecnicaDto dto) {
        PublicacaoTecnica entity = PublicacaoTecnica.findById(id);
        if (entity == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_NOT_FOUND));
        }
        
        entity.fabricanteId = dto.fabricanteId;
        entity.ataManual = dto.ataManual;
        entity.dataRevisaoManual = dto.dataRevisaoManual;
        entity.numeroRevisao = dto.numeroRevisao;
        entity.tipoManual = dto.tipoManual;
        
        return mapper.toDto(entity);
    }

    @Transactional
    public void delete(Integer id) {
        PublicacaoTecnica entity = PublicacaoTecnica.findById(id);
        if (entity == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.PUBLICACAO_NOT_FOUND));
        }
        // Soft delete
        entity.isActive = false;
    }
}
