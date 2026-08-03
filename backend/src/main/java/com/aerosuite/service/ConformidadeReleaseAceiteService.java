package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeReleaseAceite;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.service.conformidade.ConformidadeChecklistJson;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@ApplicationScoped
public class ConformidadeReleaseAceiteService {

    @Inject
    ConformidadeChecklistJson checklistJson;

    @Inject
    InternalUserContext userContext;

    @Inject
    EntityManager em;

    @ConfigProperty(name = "aerosuite.app.version", defaultValue = "0.2.0")
    String appVersion;

    public PageResponse<ConformidadeReleaseAceiteDto> listar(int page, int size) {
        long total = ConformidadeReleaseAceite.count();
        List<ConformidadeReleaseAceite> rows =
                ConformidadeReleaseAceite.findAll(Sort.by("aceiteEm").descending())
                        .page(Page.of(page, size))
                        .list();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(toDtoList(rows), total, totalPages, page, size, null);
    }

    public ConformidadeReleaseAceiteDto obter(Long id) {
        return toDto(require(id));
    }

    public ConformidadeReleaseMetaDto metaAtual() {
        ConformidadeReleaseMetaDto meta = new ConformidadeReleaseMetaDto();
        meta.versaoApp = appVersion;
        meta.flywayAte = latestFlywayVersion();
        meta.checklistPadrao = ConformidadeChecklistJson.defaultReleaseImpacto();
        return meta;
    }

    public List<ConformidadeChecklistItemDto> checklistPadrao() {
        return ConformidadeChecklistJson.defaultReleaseImpacto();
    }

    @Transactional
    public ConformidadeReleaseAceiteDto registrar(ConformidadeReleaseAceiteWriteDto body) {
        validateWrite(body);
        Integer uid = userContext.getUserId();
        if (uid == null) {
            throw new BadRequestException(ApiI18nMessages.domain("release.error.usuario_obrigatorio"));
        }
        ConformidadeReleaseAceite row = new ConformidadeReleaseAceite();
        row.versaoApp = body.versaoApp != null && !body.versaoApp.isBlank() ? body.versaoApp.trim() : appVersion;
        row.flywayAte = body.flywayAte != null && !body.flywayAte.isBlank() ? body.flywayAte.trim() : latestFlywayVersion();
        row.tipoMudanca = body.tipoMudanca != null && !body.tipoMudanca.isBlank() ? body.tipoMudanca.trim() : "EVOLUTIVA";
        row.impactoRegulatorio = Boolean.TRUE.equals(body.impactoRegulatorio);
        row.checklistJson = checklistJson.serialize(resolveChecklist(body));
        row.observacoes = body.observacoes;
        row.aceiteUsuarioId = uid;
        row.aceiteUsuarioNome = userContext.getNome();
        row.aceiteEm = LocalDateTime.now();
        row.persist();
        return toDto(row);
    }

    private ConformidadeReleaseAceite require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("release.error.id_invalido"));
        }
        ConformidadeReleaseAceite row = ConformidadeReleaseAceite.findById(id);
        if (row == null) {
            throw new NotFoundException(ApiI18nMessages.domain("release.error.nao_encontrado"));
        }
        return row;
    }

    private void validateWrite(ConformidadeReleaseAceiteWriteDto body) {
        if (body == null) {
            throw new BadRequestException(ApiI18nMessages.domain("release.error.campos_obrigatorios"));
        }
    }

    private List<ConformidadeChecklistItemDto> resolveChecklist(ConformidadeReleaseAceiteWriteDto body) {
        if (body.checklist != null && !body.checklist.isEmpty()) {
            return body.checklist;
        }
        return ConformidadeChecklistJson.defaultReleaseImpacto();
    }

    private String latestFlywayVersion() {
        try {
            Object v =
                    em.createNativeQuery(
                                    "SELECT version FROM flyway_schema_history ORDER BY installed_rank DESC LIMIT 1")
                            .getSingleResult();
            return v != null ? v.toString() : null;
        } catch (Exception e) {
            return null;
        }
    }

    private List<ConformidadeReleaseAceiteDto> toDtoList(List<ConformidadeReleaseAceite> rows) {
        List<ConformidadeReleaseAceiteDto> out = new ArrayList<>();
        for (ConformidadeReleaseAceite row : rows) {
            out.add(toDto(row));
        }
        return out;
    }

    private ConformidadeReleaseAceiteDto toDto(ConformidadeReleaseAceite row) {
        ConformidadeReleaseAceiteDto dto = new ConformidadeReleaseAceiteDto();
        dto.id = row.id;
        dto.versaoApp = row.versaoApp;
        dto.flywayAte = row.flywayAte;
        dto.tipoMudanca = row.tipoMudanca;
        dto.impactoRegulatorio = Boolean.TRUE.equals(row.impactoRegulatorio);
        dto.checklist = checklistJson.parse(row.checklistJson);
        dto.observacoes = row.observacoes;
        dto.aceiteUsuarioId = row.aceiteUsuarioId;
        dto.aceiteUsuarioNome = row.aceiteUsuarioNome;
        dto.aceiteEm = row.aceiteEm != null ? row.aceiteEm.toString() : null;
        return dto;
    }
}
