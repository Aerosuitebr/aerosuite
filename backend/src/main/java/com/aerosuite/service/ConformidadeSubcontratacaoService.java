package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeSubcontratacao;
import com.aerosuite.domain.ConformidadeSubcontratacao.StatusSubcontratacao;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.conformidade.ConformidadeDateUtil;
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
public class ConformidadeSubcontratacaoService {

    public PageResponse<ConformidadeSubcontratacaoDto> listar(
            int page, int size, String q, String status, Integer osId) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (status != null && !status.isBlank()) {
            jpql.append(" and status = ?").append(idx++);
            params.add(StatusSubcontratacao.valueOf(status.trim().toUpperCase(Locale.ROOT)));
        }
        if (osId != null) {
            jpql.append(" and osId = ?").append(idx++);
            params.add(osId);
        }
        if (q != null && !q.isBlank()) {
            String needle = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            jpql.append(" and (lower(razaoSocial) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(certificadoPart145) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(escopo) like ?").append(idx++).append(")");
            params.add(needle);
        }
        long total = ConformidadeSubcontratacao.find(jpql.toString(), params.toArray()).count();
        List<ConformidadeSubcontratacao> rows =
                ConformidadeSubcontratacao.find(
                                jpql.toString(), Sort.by("validadeCertificado").ascending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(toDtoList(rows), total, totalPages, page, size, null);
    }

    public ConformidadeAlertasResumoDto alertas(int diasJanela) {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        ConformidadeAlertasResumoDto resumo = new ConformidadeAlertasResumoDto();
        resumo.diasJanela = janela;
        for (ConformidadeSubcontratacaoDto dto : toDtoList(
                ConformidadeSubcontratacao.find(
                                "status = ?1 and validadeCertificado is not null order by validadeCertificado asc",
                                StatusSubcontratacao.ATIVO)
                        .list())) {
            if ("VENCIDA".equals(dto.severidadeAlerta)) {
                resumo.totalVencidas++;
                resumo.itens.add(dto);
            } else if ("PROXIMA".equals(dto.severidadeAlerta)) {
                resumo.totalProximas++;
                resumo.itens.add(dto);
            }
        }
        resumo.totalAtivos = ConformidadeSubcontratacao.count("status = ?1", StatusSubcontratacao.ATIVO);
        return resumo;
    }

    public ConformidadeSubcontratacaoDto obter(Long id) {
        return toDto(require(id));
    }

    @Transactional
    public ConformidadeSubcontratacaoDto criar(ConformidadeSubcontratacaoWriteDto body) {
        validateWrite(body);
        ConformidadeSubcontratacao s = new ConformidadeSubcontratacao();
        applyWrite(s, body);
        s.persist();
        return toDto(s);
    }

    @Transactional
    public ConformidadeSubcontratacaoDto atualizar(Long id, ConformidadeSubcontratacaoWriteDto body) {
        validateWrite(body);
        ConformidadeSubcontratacao s = require(id);
        applyWrite(s, body);
        s.persist();
        return toDto(s);
    }

    @Transactional
    public void excluir(Long id) {
        require(id).delete();
    }

    private ConformidadeSubcontratacao require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("subcontratacao.error.id_invalido"));
        }
        ConformidadeSubcontratacao s = ConformidadeSubcontratacao.findById(id);
        if (s == null) {
            throw new NotFoundException(ApiI18nMessages.domain("subcontratacao.error.nao_encontrada"));
        }
        return s;
    }

    private void validateWrite(ConformidadeSubcontratacaoWriteDto body) {
        if (body == null || body.razaoSocial == null || body.razaoSocial.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("subcontratacao.error.campos_obrigatorios"));
        }
        if (body.status != null && !body.status.isBlank()) {
            try {
                StatusSubcontratacao.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("subcontratacao.error.status_invalido"));
            }
        }
    }

    private void applyWrite(ConformidadeSubcontratacao s, ConformidadeSubcontratacaoWriteDto body) {
        s.razaoSocial = body.razaoSocial.trim();
        s.certificadoPart145 = body.certificadoPart145;
        s.escopo = body.escopo;
        s.validadeCertificado = ConformidadeDateUtil.parseDate(body.validadeCertificado);
        s.osId = body.osId;
        if (body.status != null && !body.status.isBlank()) {
            s.status = StatusSubcontratacao.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
        }
        s.observacoes = body.observacoes;
    }

    private List<ConformidadeSubcontratacaoDto> toDtoList(List<ConformidadeSubcontratacao> rows) {
        List<ConformidadeSubcontratacaoDto> out = new ArrayList<>();
        for (ConformidadeSubcontratacao row : rows) {
            out.add(toDto(row));
        }
        return out;
    }

    private ConformidadeSubcontratacaoDto toDto(ConformidadeSubcontratacao s) {
        ConformidadeSubcontratacaoDto dto = new ConformidadeSubcontratacaoDto();
        dto.id = s.id;
        dto.razaoSocial = s.razaoSocial;
        dto.certificadoPart145 = s.certificadoPart145;
        dto.escopo = s.escopo;
        dto.validadeCertificado = ConformidadeDateUtil.formatDate(s.validadeCertificado);
        dto.osId = s.osId;
        dto.status = s.status != null ? s.status.name() : null;
        dto.observacoes = s.observacoes;
        if (s.status == StatusSubcontratacao.ATIVO) {
            ConformidadeDateUtil.applyAlerta(s.validadeCertificado, 60, (sev, dias) -> {
                dto.severidadeAlerta = sev;
                dto.diasParaValidade = dias;
            });
        }
        return dto;
    }
}
