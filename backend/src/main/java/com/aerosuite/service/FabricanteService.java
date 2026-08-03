package com.aerosuite.service;

import com.aerosuite.domain.TenantConstants;

import com.aerosuite.domain.Fabricante;
import com.aerosuite.dto.FabricanteDto;
import com.aerosuite.mapping.FabricanteMapper;
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
public class FabricanteService {
    private static final int MAX_NOME_LEN = 100;

    @Inject FabricanteMapper mapper;
    @Inject TenantDataAccess tenantDataAccess;

    private long tid() {
        return tenantDataAccess.currentTenantId();
    }

    private Fabricante requireFabricante(Integer id) {
        Fabricante e = Fabricante.find("id = ?1", id).firstResult();
        if (e == null) {
            throw new NotFoundException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            com.aerosuite.i18n.ApiI18nMessages.FABRICANTE_NOT_FOUND, "id", String.valueOf(id)));
        }
        return e;
    }

    public FabricanteDto getById(Integer id) {
        Fabricante e = Fabricante.find("id = ?1 and isActive = ?2", id, true).firstResult();
        return e != null ? mapper.toDto(e) : null;
    }

    /** Lote para listagem de OS (evita N+1 no mapper). */
    public Map<Integer, FabricanteDto> findByIds(Set<Integer> ids) {
        if (ids == null || ids.isEmpty()) {
            return Map.of();
        }
        List<Fabricante> entities = Fabricante.list("id in ?1", ids);
        if (entities == null || entities.isEmpty()) {
            return Map.of();
        }
        Map<Integer, FabricanteDto> out = new HashMap<>();
        for (Fabricante e : entities) {
            if (e != null && e.id != null) {
                out.put(e.id, mapper.toDto(e));
            }
        }
        return out;
    }

    public record SearchResult(List<FabricanteDto> items, long total) {}

    public SearchResult search(Integer page, Integer size, String sort, String q, Boolean isActive) {
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
        Map<String, Object> params = new HashMap<>();

        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }

        if (q != null && !q.isBlank()) {
            where.add("LOWER(nome) like :q");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        PanacheQuery<Fabricante> query = Fabricante.find(where.toString(), sortObj, params);

        long total = query.count();
        List<FabricanteDto> items = query.page(Page.of(p, s)).list().stream().map(mapper::toDto).toList();
        return new SearchResult(items, total);
    }

    @Transactional
    public FabricanteDto create(FabricanteDto dto) {
        Fabricante e = mapper.toEntity(dto);
        e.nome = com.aerosuite.util.FieldLengthValidator.trimRequireMax(e.nome, MAX_NOME_LEN, "nome");
        e.tenantId = TenantConstants.tenantIdOf(tid());
        if (e.isActive == null) {
            e.isActive = true;
        }
        e.persist();
        return mapper.toDto(e);
    }

    @Transactional
    public FabricanteDto update(Integer id, FabricanteDto dto) {
        Fabricante e = requireFabricante(id);

        if (dto.isActive() != null && !dto.isActive()) {
            e.isActive = false;
            e.persist();
            return mapper.toDto(e);
        }

        Boolean currentIsActive = e.isActive;
        mapper.updateEntity(dto, e);
        e.nome = com.aerosuite.util.FieldLengthValidator.trimRequireMax(e.nome, MAX_NOME_LEN, "nome");
        e.isActive = currentIsActive;
        return mapper.toDto(e);
    }

    @Transactional
    public FabricanteDto delete(Integer id) {
        Fabricante e = requireFabricante(id);
        e.isActive = false;
        e.persist();
        return mapper.toDto(e);
    }

    @Transactional
    public FabricanteDto inactivate(Integer id) {
        return delete(id);
    }
}
