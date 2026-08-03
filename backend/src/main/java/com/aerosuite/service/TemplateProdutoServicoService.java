package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.TemplateProdutoServico;
import com.aerosuite.domain.TipoServico;
import com.aerosuite.dto.TemplateProdutoServicoDto;
import com.aerosuite.mapping.TemplateProdutoServicoMapper;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;

import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.StringJoiner;
import java.util.stream.Collectors;

@ApplicationScoped
public class TemplateProdutoServicoService {

    @Inject
    TemplateProdutoServicoMapper mapper;

    public static class SearchResult {
        public List<TemplateProdutoServicoDto> content;
        public long totalElements;
        public int totalPages;
        public int page;
        public int size;
    }

    /**
     * Busca templates com filtros
     */
    public SearchResult search(Integer page, Integer size, String sort, String q, String categoria, Boolean ativo) {
        int pageNum = page != null ? page : 0;
        int pageSize = size != null ? size : 20;

        StringJoiner where = new StringJoiner(" AND ");
        Map<String, Object> params = new HashMap<>();

        // Filtro de busca
        if (q != null && !q.isBlank()) {
            where.add("(LOWER(nomeTemplate) LIKE :q OR LOWER(produtoNome) LIKE :q OR LOWER(tipoServicoNome) LIKE :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        // Filtro de categoria
        if (categoria != null && !categoria.isBlank()) {
            where.add("categoria = :categoria");
            params.put("categoria", categoria);
        }

        // Filtro de ativo
        if (ativo != null) {
            where.add("ativo = :ativo");
            params.put("ativo", ativo);
        }

        String jpql = where.length() > 0 ? where.toString() : "1=1";

        // Ordenação - por padrão, mais utilizados primeiro
        Sort sortObj = Sort.by("vezesUtilizado").descending().and("nomeTemplate").ascending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0];
            boolean desc = parts.length > 1 && parts[1].equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        PanacheQuery<TemplateProdutoServico> query = TemplateProdutoServico.find(jpql, sortObj, params);
        long total = query.count();
        List<TemplateProdutoServico> entities = query.page(Page.of(pageNum, pageSize)).list();

        SearchResult result = new SearchResult();
        result.content = entities.stream().map(mapper::toDto).collect(Collectors.toList());
        result.totalElements = total;
        result.totalPages = (int) Math.ceil((double) total / pageSize);
        result.page = pageNum;
        result.size = pageSize;

        return result;
    }

    /**
     * Lista todas as categorias disponíveis
     */
    public List<String> listCategorias() {
        return TemplateProdutoServico.find("SELECT DISTINCT categoria FROM TemplateProdutoServico WHERE categoria IS NOT NULL ORDER BY categoria")
                .project(String.class)
                .list();
    }

    /**
     * Busca template por ID
     */
    public TemplateProdutoServicoDto findById(Long id) {
        TemplateProdutoServico entity = TemplateProdutoServico.findById(id);
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.TEMPLATE_NOT_FOUND, "id", String.valueOf(id)));
        }
        return mapper.toDto(entity);
    }

    /**
     * Cria novo template
     */
    @Transactional
    public TemplateProdutoServicoDto create(TemplateProdutoServicoDto dto) {
        TemplateProdutoServico entity = mapper.toEntity(dto);
        
        // Buscar nome do tipo de serviço
        if (dto.idTipoServico != null) {
            TipoServico tipoServico = TipoServico.findById(dto.idTipoServico.longValue());
            if (tipoServico != null) {
                entity.tipoServicoNome = tipoServico.nome;
            }
        }
        
        entity.persist();
        return mapper.toDto(entity);
    }

    /**
     * Atualiza template existente
     */
    @Transactional
    public TemplateProdutoServicoDto update(Long id, TemplateProdutoServicoDto dto) {
        TemplateProdutoServico entity = TemplateProdutoServico.findById(id);
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.TEMPLATE_NOT_FOUND, "id", String.valueOf(id)));
        }
        
        mapper.updateEntityFromDto(dto, entity);
        
        // Atualizar nome do tipo de serviço
        if (dto.idTipoServico != null) {
            TipoServico tipoServico = TipoServico.findById(dto.idTipoServico.longValue());
            if (tipoServico != null) {
                entity.tipoServicoNome = tipoServico.nome;
            }
        }
        
        entity.persist();
        return mapper.toDto(entity);
    }

    /**
     * Exclui (inativa) template
     */
    @Transactional
    public void delete(Long id) {
        TemplateProdutoServico entity = TemplateProdutoServico.findById(id);
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.TEMPLATE_NOT_FOUND, "id", String.valueOf(id)));
        }
        entity.ativo = false;
        entity.persist();
    }

    /**
     * Registra uso do template
     */
    @Transactional
    public void registrarUso(Long id) {
        TemplateProdutoServico entity = TemplateProdutoServico.findById(id);
        if (entity != null) {
            entity.incrementarUso();
            entity.persist();
        }
    }
}
