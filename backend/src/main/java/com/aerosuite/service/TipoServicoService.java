package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import org.jboss.logging.Logger;
import com.aerosuite.domain.TipoServico;
import com.aerosuite.dto.TipoServicoDto;
import com.aerosuite.mapping.TipoServicoMapper;
import io.quarkus.hibernate.orm.panache.PanacheQuery;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Parameters;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import jakarta.transaction.Transactional;

import java.util.*;

@ApplicationScoped
public class TipoServicoService {

    private static final Logger LOG = Logger.getLogger(TipoServicoService.class);
    @Inject TipoServicoMapper mapper;
    
    @PersistenceContext
    EntityManager em;

    public TipoServicoDto getById(Integer id) {
        TipoServico e = TipoServico.find("id = ?1 and isActive = ?2", id, true).firstResult();
        return e != null ? mapper.toDto(e) : null;
    }

    public record SearchResult(List<TipoServicoDto> items, long total) {} 

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
        Map<String,Object> params = new HashMap<>();

        // Filtrar apenas ativos por padrão (se isActive não for especificado ou for true)
        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }

        if (q != null && !q.isBlank()) { where.add("LOWER(nome) like :q"); params.put("q", "%"+q.toLowerCase()+"%"); }

        PanacheQuery<TipoServico> query = where.length() > 0
            ? TipoServico.find(where.toString(), sortObj, params)
            : TipoServico.findAll(sortObj);

        long total = query.count();
        List<TipoServicoDto> items = query.page(Page.of(p, s)).list().stream().map(mapper::toDto).toList();
        return new SearchResult(items, total);
    }

    @Transactional
    public TipoServicoDto create(TipoServicoDto dto) {
        TipoServico e = mapper.toEntity(dto);
        // Garantir que novos registros sejam sempre ativos
        if (e.isActive == null) {
            e.isActive = true;
        }
        e.persist();
        return mapper.toDto(e);
    }

    @Transactional
    public TipoServicoDto update(Integer id, TipoServicoDto dto) {
        TipoServico e = TipoServico.findById(id);
        if (e == null) throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_NOT_FOUND, "id", String.valueOf(id)));
        
        // Se o DTO contém isActive=false, fazer soft delete (inativar) pelo ID
        if (dto != null && dto.isActive() != null && !dto.isActive()) {
            // Chamar método delete que faz UPDATE direto pelo ID
            return delete(id);
        }
        
        // Caso contrário, atualizar normalmente
        // Salvar o valor atual de isActive antes do update
        Boolean currentIsActive = e.isActive;
        mapper.updateEntity(dto, e);
        // Restaurar o valor de isActive (não permitir alterar diretamente pelo update normal)
        e.isActive = currentIsActive;
        return mapper.toDto(e);
    }

    @Transactional
    public TipoServicoDto delete(Integer id) {
        if (id == null) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_ID_REQUIRED));
        }
        
        
        try {
            // Verificar se existe antes
            TipoServico checkBefore = TipoServico.findById(id);
            if (checkBefore == null) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_NOT_FOUND, "id", String.valueOf(id)));
            }
            
            // Se já está inativo, retornar
            if (checkBefore.isActive != null && !checkBefore.isActive) {
                return mapper.toDto(checkBefore);
            }
            
            // Executar UPDATE direto no banco usando o ID
            // Usar nome da coluna do banco (isActive) diretamente na query JPQL
            String updateQuery = "UPDATE TipoServico t SET t.isActive = false WHERE t.id = :id";
            
            int updated = em.createQuery(updateQuery)
                    .setParameter("id", id)
                    .executeUpdate();
            
            
            if (updated == 0) {
                LOG.warnf("TipoServicoService.delete - ERRO: Nenhuma linha foi atualizada para o ID: %s", id);
                throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_DEACTIVATE_NO_ROWS, "id", String.valueOf(id)));
            }
            
            // Forçar flush e limpar cache
            em.flush();
            em.clear();
            
            // Recarregar após UPDATE para retornar DTO atualizado
            TipoServico e = TipoServico.findById(id);
            if (e == null) {
                LOG.warnf("TipoServicoService.delete - ERRO: Não foi possível recarregar TipoServico ID %s", id);
                throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.TIPO_SERVICO_RELOAD_FAILED, "id", String.valueOf(id)));
            }
            
            
            return mapper.toDto(e);
            
        } catch (IllegalArgumentException e) {
            LOG.warnf(e, "TipoServicoService.delete - IllegalArgumentException: %s", e.getMessage());
            throw e;
        } catch (Exception e) {
            LOG.warnf(e, "TipoServicoService.delete - ERRO ao inativar TipoServico ID %s: %s", id, e.getMessage());
            if (e.getCause() != null) {
                LOG.warnf(e, "TipoServicoService.delete - Causa: %s", e.getCause().getMessage());
            }
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.TIPO_SERVICO_DEACTIVATE_FAILED, id + ": " + e.getMessage()), e);
        }
    }
    
    @Transactional
    public TipoServicoDto inactivate(Integer id) {
        return delete(id); // Alias para delete (soft delete)
    }
}
