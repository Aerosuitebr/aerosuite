package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeNaoConformidade;
import com.aerosuite.domain.ConformidadeNaoConformidade.CapaFase;
import com.aerosuite.domain.ConformidadeNaoConformidade.Severidade;
import com.aerosuite.domain.ConformidadeNaoConformidade.StatusNc;
import com.aerosuite.domain.OS;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.service.conformidade.ConformidadeDateUtil;
import com.aerosuite.util.FieldLengthValidator;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.time.Year;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class ConformidadeNaoConformidadeService {

    @Inject
    ConformidadeNcCapaEtapaService etapaService;

    @Inject
    EntityManager entityManager;

    @Inject
    ConformidadeNcAnexoService anexoService;

    public PageResponse<ConformidadeNaoConformidadeDto> listar(
            int page, int size, String q, String status, String severidade, Integer osId) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (status != null && !status.isBlank()) {
            jpql.append(" and status = ?").append(idx++);
            params.add(StatusNc.valueOf(status.trim().toUpperCase(Locale.ROOT)));
        }
        if (severidade != null && !severidade.isBlank()) {
            jpql.append(" and severidade = ?").append(idx++);
            params.add(Severidade.valueOf(severidade.trim().toUpperCase(Locale.ROOT)));
        }
        if (osId != null) {
            jpql.append(" and osId = ?").append(idx++);
            params.add(osId);
        }
        if (q != null && !q.isBlank()) {
            String needle = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            jpql.append(" and (lower(numero) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(titulo) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(descricao) like ?").append(idx++).append(")");
            params.add(needle);
        }
        long total = ConformidadeNaoConformidade.find(jpql.toString(), params.toArray()).count();
        List<ConformidadeNaoConformidade> rows =
                ConformidadeNaoConformidade.find(jpql.toString(), Sort.by("dataAbertura").descending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(toDtoList(rows, false), total, totalPages, page, size, null);
    }

    public ConformidadeNaoConformidadeDto obter(Long id) {
        return toDto(require(id), true);
    }

    public List<ConformidadeNcOsOpcaoDto> buscarOsOpcoes(String q) {
        List<OS> rows;
        if (q != null && !q.isBlank()) {
            String trimmed = q.trim();
            String needle = "%" + trimmed.toLowerCase(Locale.ROOT) + "%";
            Long idInterno = null;
            Integer idOsSearch = null;
            try {
                long parsed = Long.parseLong(trimmed);
                if (parsed > 0 && parsed <= Integer.MAX_VALUE) {
                    idInterno = parsed;
                    idOsSearch = (int) parsed;
                }
            } catch (NumberFormatException ignored) {
                // busca textual
            }
            if (idInterno != null) {
                rows =
                        OS.find(
                                        "(id = ?1 or idOs = ?2 or lower(clienteNome) like ?3 or lower(serialNumber) like ?3 or lower(marcasMatricula) like ?3) and isActive = true",
                                        Sort.by("id").descending(),
                                        idInterno,
                                        idOsSearch,
                                        needle)
                                .page(Page.of(0, 15))
                                .list();
            } else {
                rows =
                        OS.find(
                                        "(lower(clienteNome) like ?1 or lower(serialNumber) like ?1 or lower(marcasMatricula) like ?1 or lower(numOsOriginal) like ?1) and isActive = true",
                                        Sort.by("id").descending(),
                                        needle)
                                .page(Page.of(0, 15))
                                .list();
            }
        } else {
            rows = OS.find("isActive = true", Sort.by("id").descending()).page(Page.of(0, 15)).list();
        }
        List<ConformidadeNcOsOpcaoDto> out = new ArrayList<>();
        for (OS os : rows) {
            if (os.id == null) {
                continue;
            }
            out.add(toOsOpcao(os));
        }
        return out;
    }

    private ConformidadeNcOsOpcaoDto toOsOpcao(OS os) {
        ConformidadeNcOsOpcaoDto dto = new ConformidadeNcOsOpcaoDto();
        dto.id = os.id;
        dto.idOs = os.idOs;
        dto.clienteNome = os.clienteNome;
        dto.serialNumber = os.serialNumber;
        dto.marcasMatricula = os.marcasMatricula;
        dto.dtAbertura = ConformidadeDateUtil.formatDate(os.dtAbertura);
        return dto;
    }

    @Transactional
    public ConformidadeNaoConformidadeDto criar(ConformidadeNaoConformidadeWriteDto body) {
        validateWrite(body);
        ConformidadeNaoConformidade nc = new ConformidadeNaoConformidade();
        nc.numero = gerarNumero();
        applyWrite(nc, body);
        nc.persist();
        entityManager.flush();
        etapaService.ensureEtapas(nc.id);
        etapaService.aplicarResponsaveis(nc.id, body.etapas);
        return toDto(nc, true);
    }

    @Transactional
    public ConformidadeNaoConformidadeDto atualizar(Long id, ConformidadeNaoConformidadeWriteDto body) {
        validateWrite(body);
        ConformidadeNaoConformidade nc = require(id);
        applyWrite(nc, body);
        nc.persist();
        etapaService.aplicarResponsaveis(nc.id, body.etapas);
        return toDto(nc, true);
    }

    @Transactional
    public void excluir(Long id) {
        require(id).delete();
    }

    private String gerarNumero() {
        int year = Year.now().getValue();
        long count = ConformidadeNaoConformidade.count("numero like ?1", "NC-" + year + "-%");
        return String.format(Locale.ROOT, "NC-%d-%04d", year, count + 1);
    }

    private ConformidadeNaoConformidade require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.id_invalido"));
        }
        ConformidadeNaoConformidade nc = ConformidadeNaoConformidade.findById(id);
        if (nc == null) {
            throw new NotFoundException(ApiI18nMessages.domain("nc.error.nao_encontrada"));
        }
        return nc;
    }

    private void validateWrite(ConformidadeNaoConformidadeWriteDto body) {
        if (body == null || body.titulo == null || body.titulo.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.campos_obrigatorios"));
        }
        FieldLengthValidator.requireMax(body.titulo.trim(), 255, "titulo");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.descricao), 4000, "descricao");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.observacoes), 4000, "observacoes");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.acaoContencao), 4000, "acaoContencao");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.causaRaiz), 4000, "causaRaiz");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.acaoCorretiva), 4000, "acaoCorretiva");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.verificacaoEficacia), 4000, "verificacaoEficacia");
        if (body.severidade != null && !body.severidade.isBlank()) {
            try {
                Severidade.valueOf(body.severidade.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("nc.error.severidade_invalida"));
            }
        }
        if (body.status != null && !body.status.isBlank()) {
            try {
                StatusNc.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("nc.error.status_invalido"));
            }
        }
        if (body.capaFase != null && !body.capaFase.isBlank()) {
            try {
                CapaFase.valueOf(body.capaFase.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("nc.error.capa_fase_invalida"));
            }
        }
    }

    private void applyWrite(ConformidadeNaoConformidade nc, ConformidadeNaoConformidadeWriteDto body) {
        nc.titulo = body.titulo.trim();
        nc.descricao = body.descricao;
        if (body.severidade != null && !body.severidade.isBlank()) {
            nc.severidade = Severidade.valueOf(body.severidade.trim().toUpperCase(Locale.ROOT));
        }
        StatusNc novoStatus = nc.status;
        if (body.status != null && !body.status.isBlank()) {
            novoStatus = StatusNc.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
        }
        CapaFase novaFase = nc.capaFase;
        if (body.capaFase != null && !body.capaFase.isBlank()) {
            novaFase = CapaFase.valueOf(body.capaFase.trim().toUpperCase(Locale.ROOT));
            etapaService.validarAvancoFase(nc, novaFase);
            nc.capaFase = novaFase;
        }
        nc.causaRaiz = body.causaRaiz;
        nc.acaoContencao = body.acaoContencao;
        nc.acaoCorretiva = body.acaoCorretiva;
        nc.verificacaoEficacia = body.verificacaoEficacia;
        if (body.eficaciaConfirmada != null) {
            nc.eficaciaConfirmada = body.eficaciaConfirmada;
        }
        nc.dataVerificacao = ConformidadeDateUtil.parseDate(body.dataVerificacao);
        nc.osId = validarOsVinculo(body.osId);
        LocalDate abertura = ConformidadeDateUtil.parseDate(body.dataAbertura);
        if (abertura != null) {
            nc.dataAbertura = abertura;
        } else if (nc.dataAbertura == null) {
            nc.dataAbertura = LocalDate.now();
        }
        nc.dataFechamento = ConformidadeDateUtil.parseDate(body.dataFechamento);
        nc.observacoes = body.observacoes;

        sincronizarCapaFase(nc, novoStatus);
        if (novoStatus == StatusNc.FECHADA) {
            if (!Boolean.TRUE.equals(nc.eficaciaConfirmada)) {
                throw new BadRequestException(ApiI18nMessages.domain("nc.error.eficacia_obrigatoria"));
            }
            etapaService.validarFechamento(nc);
            if (nc.dataFechamento == null) {
                nc.dataFechamento = LocalDate.now();
            }
            nc.capaFase = CapaFase.FECHADA;
            etapaService.aprovarFechamentoAutomatico(nc.id);
        }
        nc.status = novoStatus;
        if (nc.status == StatusNc.FECHADA && nc.dataFechamento == null) {
            nc.dataFechamento = LocalDate.now();
        }
    }

    private void sincronizarCapaFase(ConformidadeNaoConformidade nc, StatusNc status) {
        if (nc.capaFase == CapaFase.FECHADA) {
            return;
        }
        if (status == StatusNc.EM_ACAO) {
            if (nc.capaFase == CapaFase.REGISTRO) {
                nc.capaFase = CapaFase.CONTENCAO;
            }
            if (nc.acaoContencao != null && !nc.acaoContencao.isBlank()) {
                nc.capaFase = CapaFase.ACAO;
            }
            if (nc.causaRaiz != null && !nc.causaRaiz.isBlank()) {
                nc.capaFase = CapaFase.CAUSA;
            }
            if (nc.acaoCorretiva != null && !nc.acaoCorretiva.isBlank()) {
                nc.capaFase = CapaFase.ACAO;
            }
            if (nc.verificacaoEficacia != null && !nc.verificacaoEficacia.isBlank()) {
                nc.capaFase = CapaFase.VERIFICACAO;
            }
        }
    }

    private List<ConformidadeNaoConformidadeDto> toDtoList(List<ConformidadeNaoConformidade> rows, boolean detalhado) {
        List<ConformidadeNaoConformidadeDto> out = new ArrayList<>();
        for (ConformidadeNaoConformidade row : rows) {
            out.add(toDto(row, detalhado));
        }
        return out;
    }

    private ConformidadeNaoConformidadeDto toDto(ConformidadeNaoConformidade nc, boolean detalhado) {
        ConformidadeNaoConformidadeDto dto = new ConformidadeNaoConformidadeDto();
        dto.id = nc.id;
        dto.numero = nc.numero;
        dto.titulo = nc.titulo;
        dto.descricao = nc.descricao;
        dto.severidade = nc.severidade != null ? nc.severidade.name() : null;
        dto.status = nc.status != null ? nc.status.name() : null;
        dto.osId = nc.osId;
        preencherOsResumo(dto, nc.osId);
        dto.dataAbertura = ConformidadeDateUtil.formatDate(nc.dataAbertura);
        dto.dataFechamento = ConformidadeDateUtil.formatDate(nc.dataFechamento);
        dto.acaoCorretiva = nc.acaoCorretiva;
        dto.causaRaiz = nc.causaRaiz;
        dto.acaoContencao = nc.acaoContencao;
        dto.verificacaoEficacia = nc.verificacaoEficacia;
        dto.eficaciaConfirmada = nc.eficaciaConfirmada;
        dto.dataVerificacao = ConformidadeDateUtil.formatDate(nc.dataVerificacao);
        dto.capaFase = nc.capaFase != null ? nc.capaFase.name() : null;
        dto.observacoes = nc.observacoes;
        if (detalhado && nc.id != null) {
            dto.etapas = etapaService.listar(nc.id);
            dto.anexos = anexoService.listar(nc.id, null);
        }
        return dto;
    }

    private Integer validarOsVinculo(Integer osInternalId) {
        if (osInternalId == null) {
            return null;
        }
        if (osInternalId <= 0) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.os_invalida"));
        }
        OS os = OS.findById(osInternalId.longValue());
        if (os == null || !Boolean.TRUE.equals(os.isActive)) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.os_invalida"));
        }
        return osInternalId;
    }

    private void preencherOsResumo(ConformidadeNaoConformidadeDto dto, Integer osInternalId) {
        if (osInternalId == null) {
            return;
        }
        OS os = OS.findById(osInternalId.longValue());
        if (os == null) {
            return;
        }
        dto.osNumero = os.idOs;
        dto.osClienteNome = os.clienteNome;
    }
}
