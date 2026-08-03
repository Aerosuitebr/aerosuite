package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.TenantConstants;

import com.aerosuite.domain.ClienteProposta;
import com.aerosuite.dto.ClientePropostaDto;
import com.aerosuite.mapping.ClientePropostaMapper;
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
public class ClientePropostaService {
    @Inject ClientePropostaMapper mapper;
    @Inject TenantDataAccess tenantDataAccess;

    public record SearchResult(List<ClientePropostaDto> items, long total) {}

    private long currentTenantId() {
        return tenantDataAccess.currentTenantId();
    }

    private ClienteProposta requireCliente(Integer id) {
        ClienteProposta entity = ClienteProposta
                .find("id = ?1", id)
                .firstResult();
        if (entity == null) {
            throw new NotFoundException(ApiI18nMessages.encode(ApiI18nMessages.CLIENTE_NOT_FOUND, "id", String.valueOf(id)));
        }
        return entity;
    }

    public SearchResult search(Integer page, Integer size, String sort, String q, Boolean isActive) {
        int p = page != null && page >= 0 ? page : 0;
        int s = size != null && size > 0 ? size : 10;

        Sort sortObj = Sort.by("nome").ascending();
        if (sort != null && !sort.isBlank()) {
            String[] parts = sort.split(",");
            String field = parts[0].trim();
            boolean desc = parts.length > 1 && parts[1].trim().equalsIgnoreCase("desc");
            sortObj = desc ? Sort.by(field).descending() : Sort.by(field).ascending();
        }

        StringJoiner where = new StringJoiner(" and ");
        Map<String,Object> params = new HashMap<>();


        if (isActive == null || isActive) {
            where.add("isActive = :isActive");
            params.put("isActive", true);
        }

        if (q != null && !q.isBlank()) {
            where.add("(lower(nome) like :q or lower(cnpjCpf) like :q or lower(email) like :q or lower(contato) like :q)");
            params.put("q", "%" + q.toLowerCase() + "%");
        }

        PanacheQuery<ClienteProposta> query = ClienteProposta.find(where.toString(), sortObj, params);

        long total = query.count();
        List<ClientePropostaDto> items = query.page(Page.of(p, s)).<ClienteProposta>list().stream()
                .map(mapper::toDto)
                .toList();
        
        return new SearchResult(items, total);
    }

    public List<ClientePropostaDto> findAll() {
        return ClienteProposta.find("isActive = ?1", Sort.by("nome").ascending(), true)
                .<ClienteProposta>list().stream()
                .map(mapper::toDto)
                .toList();
    }

    public List<ClientePropostaDto> searchByName(String nome) {
        if (nome == null || nome.isBlank()) {
            return new ArrayList<>();
        }
        return ClienteProposta.find("isActive = ?1 and lower(nome) like ?3",
                Sort.by("nome").ascending(),
                true,
                currentTenantId(),
                "%" + nome.toLowerCase() + "%")
            .<ClienteProposta>list().stream()
            .map(mapper::toDto)
            .toList();
    }

    public ClientePropostaDto findById(Integer id) {
        ClienteProposta entity = ClienteProposta
                .find("id = ?1", id)
                .firstResult();
        if (entity == null) {
            return null;
        }
        return mapper.toDto(entity);
    }

    public ClientePropostaDto findByCnpjCpf(String cnpjCpf) {
        if (cnpjCpf == null || cnpjCpf.isBlank()) {
            return null;
        }
        ClienteProposta entity = ClienteProposta
                .find("cnpjCpf = ?1 and isActive = ?2", cnpjCpf, true)
                .firstResult();
        if (entity == null) {
            return null;
        }
        return mapper.toDto(entity);
    }

    @Transactional
    public ClientePropostaDto create(ClientePropostaDto dto) {
        ClienteProposta entity = mapper.toEntity(dto);
        if (entity.isActive == null) {
            entity.isActive = true;
        }
        entity.tenantId = TenantConstants.tenantIdOf(currentTenantId());
        entity.persist();
        return mapper.toDto(entity);
    }

    @Transactional
    public ClientePropostaDto update(Integer id, ClientePropostaDto dto) {
        ClienteProposta entity = requireCliente(id);
        
        entity.nome = dto.nome;
        entity.cnpjCpf = dto.cnpjCpf;
        entity.email = dto.email;
        entity.telefone = dto.telefone;
        entity.contato = dto.contato;
        entity.endereco = dto.endereco;
        entity.cidade = dto.cidade;
        entity.estado = dto.estado;
        entity.cep = dto.cep;
        entity.observacao = dto.observacao;
        
        return mapper.toDto(entity);
    }

    @Transactional
    public void delete(Integer id) {
        ClienteProposta entity = requireCliente(id);
        entity.isActive = false;
    }
}
