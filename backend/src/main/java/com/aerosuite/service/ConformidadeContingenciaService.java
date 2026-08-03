package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeContingenciaReconciliacao;
import com.aerosuite.domain.ConformidadeContingenciaReconciliacao.StatusReconciliacao;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.service.conformidade.ConformidadeChecklistJson;
import com.aerosuite.service.conformidade.ConformidadeDateUtil;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class ConformidadeContingenciaService {

    @Inject
    ConformidadeChecklistJson checklistJson;

    @Inject
    InternalUserContext userContext;

    public PageResponse<ConformidadeContingenciaDto> listar(int page, int size, String q, String status) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (status != null && !status.isBlank()) {
            jpql.append(" and status = ?").append(idx++);
            params.add(StatusReconciliacao.valueOf(status.trim().toUpperCase(Locale.ROOT)));
        }
        if (q != null && !q.isBlank()) {
            String needle = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            jpql.append(" and lower(titulo) like ?").append(idx++);
            params.add(needle);
        }
        long total = ConformidadeContingenciaReconciliacao.find(jpql.toString(), params.toArray()).count();
        List<ConformidadeContingenciaReconciliacao> rows =
                ConformidadeContingenciaReconciliacao.find(
                                jpql.toString(), Sort.by("createdAt").descending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(toDtoList(rows), total, totalPages, page, size, null);
    }

    public ConformidadeContingenciaDto obter(Long id) {
        return toDto(require(id));
    }

    public List<ConformidadeChecklistItemDto> checklistPadrao() {
        return ConformidadeChecklistJson.defaultContingenciaReconciliacao();
    }

    @Transactional
    public ConformidadeContingenciaDto criar(ConformidadeContingenciaWriteDto body) {
        validateWrite(body, true);
        ConformidadeContingenciaReconciliacao row = new ConformidadeContingenciaReconciliacao();
        row.titulo = body.titulo.trim();
        row.checklistJson = checklistJson.serialize(resolveChecklist(body));
        row.createdByUsuarioId = userContext.getUserId();
        applyWrite(row, body);
        row.persist();
        return toDto(row);
    }

    @Transactional
    public ConformidadeContingenciaDto atualizar(Long id, ConformidadeContingenciaWriteDto body) {
        validateWrite(body, false);
        ConformidadeContingenciaReconciliacao row = require(id);
        applyWrite(row, body);
        if (body.checklist != null) {
            row.checklistJson = checklistJson.serialize(body.checklist);
        }
        row.persist();
        return toDto(row);
    }

    @Transactional
    public void excluir(Long id) {
        require(id).delete();
    }

    private ConformidadeContingenciaReconciliacao require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("contingencia.error.id_invalido"));
        }
        ConformidadeContingenciaReconciliacao row = ConformidadeContingenciaReconciliacao.findById(id);
        if (row == null) {
            throw new NotFoundException(ApiI18nMessages.domain("contingencia.error.nao_encontrada"));
        }
        return row;
    }

    private void validateWrite(ConformidadeContingenciaWriteDto body, boolean create) {
        if (body == null || body.titulo == null || body.titulo.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("contingencia.error.campos_obrigatorios"));
        }
        if (!create && body.status != null && !body.status.isBlank()) {
            try {
                StatusReconciliacao.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("contingencia.error.status_invalido"));
            }
        }
    }

    private List<ConformidadeChecklistItemDto> resolveChecklist(ConformidadeContingenciaWriteDto body) {
        if (body.checklist != null && !body.checklist.isEmpty()) {
            return body.checklist;
        }
        return ConformidadeChecklistJson.defaultContingenciaReconciliacao();
    }

    private void applyWrite(ConformidadeContingenciaReconciliacao row, ConformidadeContingenciaWriteDto body) {
        if (body.titulo != null && !body.titulo.isBlank()) {
            row.titulo = body.titulo.trim();
        }
        row.osId = body.osId;
        row.periodoInicio = ConformidadeDateUtil.parseDate(body.periodoInicio);
        row.periodoFim = ConformidadeDateUtil.parseDate(body.periodoFim);
        row.observacoes = body.observacoes;
        if (body.status != null && !body.status.isBlank()) {
            StatusReconciliacao st = StatusReconciliacao.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
            row.status = st;
            if (st == StatusReconciliacao.CONCLUIDA && row.concluidoEm == null) {
                row.concluidoEm = LocalDateTime.now();
            }
        }
    }

    private List<ConformidadeContingenciaDto> toDtoList(List<ConformidadeContingenciaReconciliacao> rows) {
        List<ConformidadeContingenciaDto> out = new ArrayList<>();
        for (ConformidadeContingenciaReconciliacao row : rows) {
            out.add(toDto(row));
        }
        return out;
    }

    private ConformidadeContingenciaDto toDto(ConformidadeContingenciaReconciliacao row) {
        ConformidadeContingenciaDto dto = new ConformidadeContingenciaDto();
        dto.id = row.id;
        dto.titulo = row.titulo;
        dto.osId = row.osId;
        dto.periodoInicio = ConformidadeDateUtil.formatDate(row.periodoInicio);
        dto.periodoFim = ConformidadeDateUtil.formatDate(row.periodoFim);
        dto.checklist = checklistJson.parse(row.checklistJson);
        dto.status = row.status != null ? row.status.name() : null;
        dto.observacoes = row.observacoes;
        dto.concluidoEm = row.concluidoEm != null ? row.concluidoEm.toString() : null;
        dto.createdAt = row.createdAt != null ? row.createdAt.toString() : null;
        return dto;
    }
}
