package com.aerosuite.service;

import com.aerosuite.domain.SgqDocumentoControlado;
import com.aerosuite.domain.SgqDocumentoControlado.StatusDocumento;
import com.aerosuite.domain.SgqDocumentoControlado.TipoDocumento;
import com.aerosuite.domain.SgqDocumentoRevisaoHistorico;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.util.FieldLengthValidator;
import com.aerosuite.service.conformidade.ConformidadeDateUtil;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class SgqDocumentoService {

    @Inject
    InternalUserContext internalUser;

    @Inject
    EntityManager entityManager;

    public PageResponse<SgqDocumentoDto> listar(
            int page, int size, String q, String tipo, String status, Boolean somenteAtivos) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (somenteAtivos == null || somenteAtivos) {
            jpql.append(" and ativo = true");
        }
        if (tipo != null && !tipo.isBlank()) {
            jpql.append(" and tipo = ?").append(idx++);
            params.add(TipoDocumento.valueOf(tipo.trim().toUpperCase(Locale.ROOT)));
        }
        if (status != null && !status.isBlank()) {
            jpql.append(" and status = ?").append(idx++);
            params.add(StatusDocumento.valueOf(status.trim().toUpperCase(Locale.ROOT)));
        }
        if (q != null && !q.isBlank()) {
            String needle = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            jpql.append(" and (lower(codigo) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(titulo) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(revisao) like ?").append(idx++).append(")");
            params.add(needle);
        }
        long total = SgqDocumentoControlado.find(jpql.toString(), params.toArray()).count();
        List<SgqDocumentoControlado> rows =
                SgqDocumentoControlado.find(jpql.toString(), Sort.by("codigo").ascending().and("revisao").descending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(toDtoList(rows), total, totalPages, page, size, null);
    }

    public ConformidadeAlertasResumoDto alertas(int diasJanela) {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        ConformidadeAlertasResumoDto resumo = new ConformidadeAlertasResumoDto();
        resumo.diasJanela = janela;
        for (SgqDocumentoDto dto : toDtoList(
                SgqDocumentoControlado.find("ativo = true and status = ?1 order by dataVigencia asc", StatusDocumento.VIGENTE)
                        .list())) {
            if ("VENCIDA".equals(dto.severidadeAlerta)) {
                resumo.totalVencidas++;
                resumo.itens.add(dto);
            } else if ("PROXIMA".equals(dto.severidadeAlerta)) {
                resumo.totalProximas++;
                resumo.itens.add(dto);
            }
        }
        resumo.totalAtivos = SgqDocumentoControlado.count("ativo = true and status = ?1", StatusDocumento.VIGENTE);
        return resumo;
    }

    public SgqDocumentoDto obter(Long id) {
        return toDto(require(id));
    }

    @Transactional
    public SgqDocumentoDto criar(SgqDocumentoWriteDto body) {
        validateWrite(body);
        obsoletarRevisaoAnterior(body.codigo, body.revisao, null);
        SgqDocumentoControlado doc = new SgqDocumentoControlado();
        applyWrite(doc, body);
        if (doc.status == null) {
            doc.status = StatusDocumento.VIGENTE;
        }
        doc.persist();
        entityManager.flush();
        registrarHistorico(doc, null, null, "Nova revisão publicada");
        return toDto(doc);
    }

    @Transactional
    public SgqDocumentoDto publicarNovaRevisao(Long idDocumentoAnterior, SgqDocumentoWriteDto body) {
        validateWrite(body);
        SgqDocumentoControlado anterior = require(idDocumentoAnterior);
        obsoletarRevisaoAnterior(anterior.codigo, body.revisao, anterior.id);
        SgqDocumentoControlado doc = new SgqDocumentoControlado();
        applyWrite(doc, body);
        doc.codigo = anterior.codigo;
        doc.status = StatusDocumento.VIGENTE;
        doc.persist();
        anterior.status = StatusDocumento.OBSOLETO;
        anterior.persist();
        registrarHistorico(
                doc,
                anterior.revisao,
                anterior.status != null ? anterior.status.name() : null,
                "Revisão anterior obsoletada");
        return toDto(doc);
    }

    public List<SgqDocumentoHistoricoDto> historico(String codigo) {
        if (codigo == null || codigo.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("sgq.error.codigo_obrigatorio"));
        }
        List<SgqDocumentoRevisaoHistorico> rows =
                SgqDocumentoRevisaoHistorico.find("codigo = ?1 order by createdAt desc", codigo.trim()).list();
        List<SgqDocumentoHistoricoDto> out = new ArrayList<>();
        for (SgqDocumentoRevisaoHistorico row : rows) {
            SgqDocumentoHistoricoDto dto = new SgqDocumentoHistoricoDto();
            dto.id = row.id;
            dto.documentoId = row.documentoId;
            dto.codigo = row.codigo;
            dto.revisaoAnterior = row.revisaoAnterior;
            dto.revisaoNova = row.revisaoNova;
            dto.statusAnterior = row.statusAnterior;
            dto.statusNovo = row.statusNovo;
            dto.observacao = row.observacao;
            dto.usuarioEmail = row.usuarioEmail;
            dto.createdAt = row.createdAt != null ? row.createdAt.toString() : null;
            out.add(dto);
        }
        return out;
    }

    private void obsoletarRevisaoAnterior(String codigo, String novaRevisao, Long excetoId) {
        if (codigo == null || codigo.isBlank()) {
            return;
        }
        List<SgqDocumentoControlado> vigentes =
                SgqDocumentoControlado.find(
                                "ativo = true and status = ?1 and codigo = ?2",
                                StatusDocumento.VIGENTE,
                                codigo.trim())
                        .list();
        for (SgqDocumentoControlado prev : vigentes) {
            if (excetoId != null && excetoId.equals(prev.id)) {
                continue;
            }
            if (novaRevisao != null && novaRevisao.equals(prev.revisao)) {
                continue;
            }
            prev.status = StatusDocumento.OBSOLETO;
            prev.persist();
            registrarHistorico(prev, prev.revisao, StatusDocumento.VIGENTE.name(), "Obsoletado por nova revisão");
        }
    }

    private void registrarHistorico(
            SgqDocumentoControlado doc, String revisaoAnterior, String statusAnterior, String obs) {
        SgqDocumentoRevisaoHistorico hist = new SgqDocumentoRevisaoHistorico();
        hist.documentoId = doc.id;
        hist.codigo = doc.codigo;
        hist.revisaoAnterior = revisaoAnterior;
        hist.revisaoNova = doc.revisao;
        hist.statusAnterior = statusAnterior;
        hist.statusNovo = doc.status != null ? doc.status.name() : StatusDocumento.VIGENTE.name();
        hist.observacao = obs;
        hist.usuarioEmail = internalUser.getEmail();
        hist.persist();
    }

    @Transactional
    public SgqDocumentoDto atualizar(Long id, SgqDocumentoWriteDto body) {
        validateWrite(body);
        SgqDocumentoControlado doc = require(id);
        applyWrite(doc, body);
        doc.persist();
        return toDto(doc);
    }

    @Transactional
    public void excluir(Long id) {
        SgqDocumentoControlado doc = require(id);
        doc.ativo = false;
        doc.persist();
    }

    private SgqDocumentoControlado require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("sgq.error.id_invalido"));
        }
        SgqDocumentoControlado doc = SgqDocumentoControlado.findById(id);
        if (doc == null) {
            throw new NotFoundException(ApiI18nMessages.domain("sgq.error.nao_encontrado"));
        }
        return doc;
    }

    private void validateWrite(SgqDocumentoWriteDto body) {
        if (body == null || body.codigo == null || body.codigo.isBlank() || body.titulo == null || body.titulo.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("sgq.error.campos_obrigatorios"));
        }
        FieldLengthValidator.requireMax(body.codigo.trim(), 80, "codigo");
        FieldLengthValidator.requireMax(body.titulo.trim(), 255, "titulo");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.revisao), 32, "revisao");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.referenciaArquivo), 512, "referenciaArquivo");
        if (body.tipo != null && !body.tipo.isBlank()) {
            try {
                TipoDocumento.valueOf(body.tipo.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("sgq.error.tipo_invalido"));
            }
        }
        if (body.status != null && !body.status.isBlank()) {
            try {
                StatusDocumento.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("sgq.error.status_invalido"));
            }
        }
    }

    private void applyWrite(SgqDocumentoControlado doc, SgqDocumentoWriteDto body) {
        if (body.tipo != null && !body.tipo.isBlank()) {
            doc.tipo = TipoDocumento.valueOf(body.tipo.trim().toUpperCase(Locale.ROOT));
        } else if (doc.tipo == null) {
            doc.tipo = TipoDocumento.PROCEDIMENTO;
        }
        doc.codigo = body.codigo.trim();
        doc.titulo = body.titulo.trim();
        if (body.revisao != null && !body.revisao.isBlank()) {
            doc.revisao = FieldLengthValidator.trimRequireMax(body.revisao, 32, "revisao");
        } else if (doc.revisao == null || doc.revisao.isBlank()) {
            doc.revisao = "00";
        }
        doc.dataRevisao = ConformidadeDateUtil.parseDate(body.dataRevisao);
        doc.dataVigencia = ConformidadeDateUtil.parseDate(body.dataVigencia);
        if (body.status != null && !body.status.isBlank()) {
            doc.status = StatusDocumento.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
        }
        doc.referenciaArquivo = FieldLengthValidator.trimRequireMax(body.referenciaArquivo, 512, "referenciaArquivo");
        doc.observacoes = body.observacoes;
        if (body.ativo != null) {
            doc.ativo = body.ativo;
        }
    }

    private List<SgqDocumentoDto> toDtoList(List<SgqDocumentoControlado> rows) {
        List<SgqDocumentoDto> out = new ArrayList<>();
        for (SgqDocumentoControlado row : rows) {
            out.add(toDto(row));
        }
        return out;
    }

    private SgqDocumentoDto toDto(SgqDocumentoControlado doc) {
        SgqDocumentoDto dto = new SgqDocumentoDto();
        dto.id = doc.id;
        dto.tipo = doc.tipo != null ? doc.tipo.name() : null;
        dto.codigo = doc.codigo;
        dto.titulo = doc.titulo;
        dto.revisao = doc.revisao;
        dto.dataRevisao = ConformidadeDateUtil.formatDate(doc.dataRevisao);
        dto.dataVigencia = ConformidadeDateUtil.formatDate(doc.dataVigencia);
        dto.status = doc.status != null ? doc.status.name() : null;
        dto.referenciaArquivo = doc.referenciaArquivo;
        dto.arquivoNome = doc.arquivoNome;
        dto.temArquivo = doc.arquivoPath != null && !doc.arquivoPath.isBlank();
        dto.arquivoTamanho = doc.arquivoTamanho;
        dto.observacoes = doc.observacoes;
        dto.ativo = Boolean.TRUE.equals(doc.ativo);
        if (doc.status == StatusDocumento.VIGENTE) {
            ConformidadeDateUtil.applyAlerta(doc.dataVigencia, 60, (sev, dias) -> {
                dto.severidadeAlerta = sev;
                dto.diasParaVigencia = dias;
            });
        }
        return dto;
    }
}
