package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeCalibracaoFerramenta;
import com.aerosuite.domain.ConformidadeCalibracaoFerramenta.TipoItem;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.util.FieldLengthValidator;
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
public class ConformidadeCalibracaoService {

    public PageResponse<ConformidadeCalibracaoDto> listar(
            int page, int size, String q, String tipo, Boolean somenteAtivos) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (somenteAtivos == null || somenteAtivos) {
            jpql.append(" and ativo = true");
        }
        if (tipo != null && !tipo.isBlank()) {
            jpql.append(" and tipo = ?").append(idx++);
            params.add(TipoItem.valueOf(tipo.trim().toUpperCase(Locale.ROOT)));
        }
        if (q != null && !q.isBlank()) {
            String needle = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            jpql.append(" and (lower(identificador) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(descricao) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(localizacao) like ?").append(idx++).append(")");
            params.add(needle);
        }
        long total = ConformidadeCalibracaoFerramenta.find(jpql.toString(), params.toArray()).count();
        List<ConformidadeCalibracaoFerramenta> rows =
                ConformidadeCalibracaoFerramenta.find(
                                jpql.toString(), Sort.by("dataProximaCalibracao").ascending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(toDtoList(rows), total, totalPages, page, size, null);
    }

    public ConformidadeAlertasResumoDto alertas(int diasJanela) {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        ConformidadeAlertasResumoDto resumo = new ConformidadeAlertasResumoDto();
        resumo.diasJanela = janela;
        for (ConformidadeCalibracaoDto dto : toDtoList(
                ConformidadeCalibracaoFerramenta.find(
                                "ativo = true and dataProximaCalibracao is not null order by dataProximaCalibracao asc")
                        .list())) {
            if ("VENCIDA".equals(dto.severidadeAlerta)) {
                resumo.totalVencidas++;
                resumo.itens.add(dto);
            } else if ("PROXIMA".equals(dto.severidadeAlerta)) {
                resumo.totalProximas++;
                resumo.itens.add(dto);
            }
        }
        resumo.totalAtivos = ConformidadeCalibracaoFerramenta.count("ativo = true");
        return resumo;
    }

    public ConformidadeCalibracaoDto obter(Long id) {
        return toDto(require(id));
    }

    @Transactional
    public ConformidadeCalibracaoDto criar(ConformidadeCalibracaoWriteDto body) {
        validateWrite(body);
        ConformidadeCalibracaoFerramenta c = new ConformidadeCalibracaoFerramenta();
        applyWrite(c, body);
        c.persist();
        return toDto(c);
    }

    @Transactional
    public ConformidadeCalibracaoDto atualizar(Long id, ConformidadeCalibracaoWriteDto body) {
        validateWrite(body);
        ConformidadeCalibracaoFerramenta c = require(id);
        applyWrite(c, body);
        c.persist();
        return toDto(c);
    }

    @Transactional
    public void excluir(Long id) {
        require(id).delete();
    }

    private ConformidadeCalibracaoFerramenta require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("calibracao.error.id_invalido"));
        }
        ConformidadeCalibracaoFerramenta c = ConformidadeCalibracaoFerramenta.findById(id);
        if (c == null) {
            throw new NotFoundException(ApiI18nMessages.domain("calibracao.error.nao_encontrado"));
        }
        return c;
    }

    private void validateWrite(ConformidadeCalibracaoWriteDto body) {
        if (body == null
                || body.identificador == null
                || body.identificador.isBlank()
                || body.descricao == null
                || body.descricao.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("calibracao.error.campos_obrigatorios"));
        }
        FieldLengthValidator.requireMax(body.identificador.trim(), 80, "identificador");
        FieldLengthValidator.requireMax(body.descricao.trim(), 255, "descricao");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.localizacao), 120, "localizacao");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.certificadoRef), 120, "certificadoRef");
        if (body.tipo != null && !body.tipo.isBlank()) {
            try {
                TipoItem.valueOf(body.tipo.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("calibracao.error.tipo_invalido"));
            }
        }
    }

    private void applyWrite(ConformidadeCalibracaoFerramenta c, ConformidadeCalibracaoWriteDto body) {
        c.identificador = body.identificador.trim();
        c.descricao = body.descricao.trim();
        if (body.tipo != null && !body.tipo.isBlank()) {
            c.tipo = TipoItem.valueOf(body.tipo.trim().toUpperCase(Locale.ROOT));
        } else if (c.tipo == null) {
            c.tipo = TipoItem.INSTRUMENTO;
        }
        c.localizacao = FieldLengthValidator.trimRequireMax(body.localizacao, 120, "localizacao");
        c.dataUltimaCalibracao = ConformidadeDateUtil.parseDate(body.dataUltimaCalibracao);
        c.dataProximaCalibracao = ConformidadeDateUtil.parseDate(body.dataProximaCalibracao);
        c.certificadoRef = FieldLengthValidator.trimRequireMax(body.certificadoRef, 120, "certificadoRef");
        c.observacoes = body.observacoes;
        if (body.ativo != null) {
            c.ativo = body.ativo;
        }
    }

    private List<ConformidadeCalibracaoDto> toDtoList(List<ConformidadeCalibracaoFerramenta> rows) {
        List<ConformidadeCalibracaoDto> out = new ArrayList<>();
        for (ConformidadeCalibracaoFerramenta row : rows) {
            out.add(toDto(row));
        }
        return out;
    }

    private ConformidadeCalibracaoDto toDto(ConformidadeCalibracaoFerramenta c) {
        ConformidadeCalibracaoDto dto = new ConformidadeCalibracaoDto();
        dto.id = c.id;
        dto.identificador = c.identificador;
        dto.descricao = c.descricao;
        dto.tipo = c.tipo != null ? c.tipo.name() : null;
        dto.localizacao = c.localizacao;
        dto.dataUltimaCalibracao = ConformidadeDateUtil.formatDate(c.dataUltimaCalibracao);
        dto.dataProximaCalibracao = ConformidadeDateUtil.formatDate(c.dataProximaCalibracao);
        dto.certificadoRef = c.certificadoRef;
        dto.observacoes = c.observacoes;
        dto.ativo = Boolean.TRUE.equals(c.ativo);
        ConformidadeDateUtil.applyAlerta(c.dataProximaCalibracao, 30, (sev, dias) -> {
            dto.severidadeAlerta = sev;
            dto.diasParaCalibracao = dias;
        });
        return dto;
    }
}
