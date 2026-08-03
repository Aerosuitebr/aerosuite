package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeTreinamentoObrigatorio;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class ConformidadeTreinamentoObrigatorioService {

    public PageResponse<ConformidadeTreinamentoObrigatorioDto> listar(int page, int size, String funcao, String q) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (funcao != null && !funcao.isBlank()) {
            jpql.append(" and upper(funcaoCodigo) = ?").append(idx++);
            params.add(funcao.trim().toUpperCase(Locale.ROOT));
        }
        if (q != null && !q.isBlank()) {
            String pattern = "%" + q.trim().toUpperCase(Locale.ROOT) + "%";
            jpql.append(" and (upper(funcaoCodigo) like ?").append(idx);
            jpql.append(" or upper(curso) like ?").append(idx).append(")");
            params.add(pattern);
            params.add(pattern);
            idx++;
        }
        long total = ConformidadeTreinamentoObrigatorio.find(jpql.toString(), params.toArray()).count();
        List<ConformidadeTreinamentoObrigatorio> rows =
                ConformidadeTreinamentoObrigatorio.find(
                                jpql.toString(), Sort.by("funcaoCodigo").ascending().and("curso").ascending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(toDtoList(rows), total, totalPages, page, size, null);
    }

    public ConformidadeTreinamentoObrigatorioDto obter(Long id) {
        return toDto(require(id));
    }

    @Transactional
    public ConformidadeTreinamentoObrigatorioDto criar(ConformidadeTreinamentoObrigatorioWriteDto body) {
        validate(body);
        ConformidadeTreinamentoObrigatorio row = new ConformidadeTreinamentoObrigatorio();
        apply(row, body);
        row.persist();
        return toDto(row);
    }

    @Transactional
    public ConformidadeTreinamentoObrigatorioDto atualizar(Long id, ConformidadeTreinamentoObrigatorioWriteDto body) {
        validate(body);
        ConformidadeTreinamentoObrigatorio row = require(id);
        apply(row, body);
        row.persist();
        return toDto(row);
    }

    @Transactional
    public void excluir(Long id) {
        ConformidadeTreinamentoObrigatorio row = require(id);
        row.ativo = false;
        row.persist();
    }

    private ConformidadeTreinamentoObrigatorio require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("treinamento.obrig.error.id_invalido"));
        }
        ConformidadeTreinamentoObrigatorio row = ConformidadeTreinamentoObrigatorio.findById(id);
        if (row == null) {
            throw new NotFoundException(ApiI18nMessages.domain("treinamento.obrig.error.nao_encontrado"));
        }
        return row;
    }

    private void validate(ConformidadeTreinamentoObrigatorioWriteDto body) {
        if (body == null
                || body.funcaoCodigo == null
                || body.funcaoCodigo.isBlank()
                || body.curso == null
                || body.curso.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("treinamento.obrig.error.campos_obrigatorios"));
        }
    }

    private void apply(ConformidadeTreinamentoObrigatorio row, ConformidadeTreinamentoObrigatorioWriteDto body) {
        row.funcaoCodigo = body.funcaoCodigo.trim().toUpperCase(Locale.ROOT);
        row.curso = body.curso.trim();
        if (body.validadeMeses != null && body.validadeMeses > 0) {
            row.validadeMeses = body.validadeMeses;
        }
        row.observacoes = body.observacoes;
        if (body.ativo != null) {
            row.ativo = body.ativo;
        }
    }

    private List<ConformidadeTreinamentoObrigatorioDto> toDtoList(List<ConformidadeTreinamentoObrigatorio> rows) {
        List<ConformidadeTreinamentoObrigatorioDto> out = new ArrayList<>();
        for (ConformidadeTreinamentoObrigatorio row : rows) {
            out.add(toDto(row));
        }
        return out;
    }

    private ConformidadeTreinamentoObrigatorioDto toDto(ConformidadeTreinamentoObrigatorio row) {
        ConformidadeTreinamentoObrigatorioDto dto = new ConformidadeTreinamentoObrigatorioDto();
        dto.id = row.id;
        dto.funcaoCodigo = row.funcaoCodigo;
        dto.curso = row.curso;
        dto.validadeMeses = row.validadeMeses;
        dto.observacoes = row.observacoes;
        dto.ativo = Boolean.TRUE.equals(row.ativo);
        return dto;
    }
}
