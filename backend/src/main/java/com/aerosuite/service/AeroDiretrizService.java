package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.AeroDiretriz;
import com.aerosuite.domain.Fcu;
import com.aerosuite.domain.OS;
import com.aerosuite.dto.AeroDiretrizAlertasResumoDto;
import com.aerosuite.dto.AeroDiretrizDto;
import com.aerosuite.dto.AeroDiretrizWriteDto;
import com.aerosuite.dto.PageResponse;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.FieldLengthValidator;
import com.aerosuite.util.PanacheMaps;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class AeroDiretrizService {

    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    EntityManager entityManager;

    public PageResponse<AeroDiretrizDto> listar(
            int page, int size, String q, String tipo, String status, Integer fcuId) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (tipo != null && !tipo.isBlank()) {
            jpql.append(" and tipo = ?").append(idx++);
            params.add(AeroDiretriz.TipoDiretriz.valueOf(tipo.trim().toUpperCase(Locale.ROOT)));
        }
        if (status != null && !status.isBlank()) {
            jpql.append(" and status = ?").append(idx++);
            params.add(AeroDiretriz.StatusDiretriz.valueOf(status.trim().toUpperCase(Locale.ROOT)));
        }
        if (fcuId != null) {
            jpql.append(" and fcuId = ?").append(idx++);
            params.add(fcuId);
        }
        if (q != null && !q.isBlank()) {
            String like = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            jpql.append(" and (lower(numero) like ?")
                    .append(idx)
                    .append(" or lower(titulo) like ?")
                    .append(idx)
                    .append(" or (partNumber is not null and lower(partNumber) like ?")
                    .append(idx)
                    .append(")");
            params.add(like);
            idx++;
        }
        long total = AeroDiretriz.find(jpql.toString(), params.toArray()).count();
        List<AeroDiretriz> rows =
                AeroDiretriz.find(jpql.toString(), Sort.by("dataLimiteCumprimento").ascending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        List<AeroDiretrizDto> dtos = toDtoList(rows);
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(dtos, total, totalPages, page, size, null);
    }

    public AeroDiretrizAlertasResumoDto alertas(int diasJanela) {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        LocalDate hoje = LocalDate.now();
        LocalDate limiteJanela = hoje.plusDays(janela);

        List<AeroDiretriz> candidatas =
                AeroDiretriz.find(
                                "status in (?1, ?2) and dataLimiteCumprimento is not null"
                                        + " order by dataLimiteCumprimento asc",
                                AeroDiretriz.StatusDiretriz.ABERTA,
                                AeroDiretriz.StatusDiretriz.EM_ANDAMENTO)
                        .list();

        AeroDiretrizAlertasResumoDto resumo = new AeroDiretrizAlertasResumoDto();
        resumo.diasJanela = janela;
        for (AeroDiretrizDto dto : toDtoList(candidatas)) {
            LocalDate limite = parseDate(dto.dataLimiteCumprimento);
            if (limite == null) {
                continue;
            }
            if (limite.isBefore(hoje)) {
                dto.severidadeAlerta = "VENCIDA";
                resumo.totalVencidas++;
                resumo.itens.add(dto);
            } else if (!limite.isAfter(limiteJanela)) {
                dto.severidadeAlerta = "PROXIMA";
                resumo.totalProximas++;
                resumo.itens.add(dto);
            }
        }
        resumo.totalAbertas =
                AeroDiretriz.count(
                        "status in (?1, ?2)",
                        AeroDiretriz.StatusDiretriz.ABERTA,
                        AeroDiretriz.StatusDiretriz.EM_ANDAMENTO);
        return resumo;
    }

    public List<AeroDiretrizDto> aplicaveis(Integer fcuId, String partNumber, String serialNumber) {
        List<AeroDiretriz> found = new ArrayList<>();
        if (fcuId != null) {
            found.addAll(
                    AeroDiretriz.find(
                                    "fcuId = ?1 and status in (?2, ?3) order by dataLimiteCumprimento asc",
                                    fcuId,
                                    AeroDiretriz.StatusDiretriz.ABERTA,
                                    AeroDiretriz.StatusDiretriz.EM_ANDAMENTO)
                            .list());
        }
        if (partNumber != null && !partNumber.isBlank()) {
            String pn = partNumber.trim();
            List<AeroDiretriz> byPn =
                    AeroDiretriz.find(
                                    "partNumber = ?1 and status in (?2, ?3) order by dataLimiteCumprimento asc",
                                    pn,
                                    AeroDiretriz.StatusDiretriz.ABERTA,
                                    AeroDiretriz.StatusDiretriz.EM_ANDAMENTO)
                            .list();
            for (AeroDiretriz d : byPn) {
                if (found.stream().noneMatch(x -> x.id.equals(d.id))) {
                    found.add(d);
                }
            }
        }
        if (serialNumber != null && !serialNumber.isBlank()) {
            String sn = serialNumber.trim();
            List<AeroDiretriz> bySn =
                    AeroDiretriz.find(
                                    "serialNumber = ?1 and status in (?2, ?3) order by dataLimiteCumprimento asc",
                                    sn,
                                    AeroDiretriz.StatusDiretriz.ABERTA,
                                    AeroDiretriz.StatusDiretriz.EM_ANDAMENTO)
                            .list();
            for (AeroDiretriz d : bySn) {
                if (found.stream().noneMatch(x -> x.id.equals(d.id))) {
                    found.add(d);
                }
            }
        }
        return toDtoList(found);
    }

    public AeroDiretrizDto obter(Long id) {
        AeroDiretriz d = require(id);
        return toDto(d);
    }

    @Transactional
    public AeroDiretrizDto criar(AeroDiretrizWriteDto body) {
        validateWrite(body, true);
        AeroDiretriz d = new AeroDiretriz();
        applyWrite(d, body);
        d.persist();
        entityManager.flush();
        return toDto(d);
    }

    @Transactional
    public AeroDiretrizDto atualizar(Long id, AeroDiretrizWriteDto body) {
        validateWrite(body, false);
        AeroDiretriz d = require(id);
        applyWrite(d, body);
        d.persist();
        entityManager.flush();
        return toDto(d);
    }

    @Transactional
    public void excluir(Long id) {
        AeroDiretriz d = require(id);
        d.delete();
    }

    private AeroDiretriz require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("aero.diretriz.error.id_invalido"));
        }
        AeroDiretriz d = AeroDiretriz.findById(id);
        if (d == null) {
            throw new NotFoundException(ApiI18nMessages.domain("aero.diretriz.error.nao_encontrada"));
        }
        return d;
    }

    private void validateWrite(AeroDiretrizWriteDto body, boolean create) {
        if (body == null) {
            throw new BadRequestException(ApiI18nMessages.domain("aero.diretriz.error.payload_vazio"));
        }
        if (create && (body.numero == null || body.numero.isBlank())) {
            throw new BadRequestException(ApiI18nMessages.domain("aero.diretriz.error.numero_obrigatorio"));
        }
        if (create && (body.titulo == null || body.titulo.isBlank())) {
            throw new BadRequestException(ApiI18nMessages.domain("aero.diretriz.error.titulo_obrigatorio"));
        }
        if (body.tipo != null && !body.tipo.isBlank()) {
            try {
                AeroDiretriz.TipoDiretriz.valueOf(body.tipo.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("aero.diretriz.error.tipo_invalido"));
            }
        }
        if (body.status != null && !body.status.isBlank()) {
            try {
                AeroDiretriz.StatusDiretriz.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("aero.diretriz.error.status_invalido"));
            }
        }
        if (body.osCumprimentoId != null) {
            tenantDataAccess.requireOS(body.osCumprimentoId);
        }
        if (body.fcuId != null) {
            Fcu fcu = Fcu.findById(body.fcuId);
            if (fcu == null || (fcu.isActive != null && !fcu.isActive)) {
                throw new BadRequestException(ApiI18nMessages.domain("aero.diretriz.error.fcu_invalido"));
            }
        }
        if (body.numero != null && !body.numero.isBlank()) {
            FieldLengthValidator.requireMax(body.numero.trim(), 80, "numero");
        }
        if (body.titulo != null && !body.titulo.isBlank()) {
            FieldLengthValidator.requireMax(body.titulo.trim(), 500, "titulo");
        }
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.emissor), 120, "emissor");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.ata), 32, "ata");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.partNumber), 100, "partNumber");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.serialNumber), 100, "serialNumber");
    }

    private void applyWrite(AeroDiretriz d, AeroDiretrizWriteDto body) {
        if (body.tipo != null && !body.tipo.isBlank()) {
            d.tipo = AeroDiretriz.TipoDiretriz.valueOf(body.tipo.trim().toUpperCase(Locale.ROOT));
        } else if (d.tipo == null) {
            d.tipo = AeroDiretriz.TipoDiretriz.AD;
        }
        if (body.numero != null) {
            d.numero = body.numero.trim();
        }
        if (body.titulo != null) {
            d.titulo = body.titulo.trim();
        }
        if (body.emissor != null) {
            d.emissor = trimOrNull(body.emissor);
        }
        if (body.ata != null) {
            d.ata = trimOrNull(body.ata);
        }
        if (body.fcuId != null) {
            d.fcuId = body.fcuId;
        }
        if (body.partNumber != null) {
            d.partNumber = trimOrNull(body.partNumber);
        }
        if (body.serialNumber != null) {
            d.serialNumber = trimOrNull(body.serialNumber);
        }
        if (body.dataEmissao != null) {
            d.dataEmissao = parseDate(body.dataEmissao);
        }
        if (body.dataLimiteCumprimento != null) {
            d.dataLimiteCumprimento = parseDate(body.dataLimiteCumprimento);
        }
        if (body.dataCumprimento != null) {
            d.dataCumprimento = parseDate(body.dataCumprimento);
        }
        if (body.status != null && !body.status.isBlank()) {
            d.status = AeroDiretriz.StatusDiretriz.valueOf(body.status.trim().toUpperCase(Locale.ROOT));
        }
        if (body.osCumprimentoId != null) {
            d.osCumprimentoId = body.osCumprimentoId;
        }
        if (body.observacoes != null) {
            d.observacoes = trimOrNull(body.observacoes);
        }
        if (d.status == AeroDiretriz.StatusDiretriz.CUMPRIDA && d.dataCumprimento == null) {
            d.dataCumprimento = LocalDate.now();
        }
    }

    private List<AeroDiretrizDto> toDtoList(List<AeroDiretriz> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        Set<Integer> fcuIds = rows.stream()
                .map(d -> d.fcuId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Set<Long> osIds = rows.stream()
                .map(d -> d.osCumprimentoId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Integer, Fcu> fcus = fcuIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<Fcu, Integer>byId(Fcu.list("id in ?1", fcuIds), f -> f.id);
        Map<Long, OS> oss = osIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<OS, Long>byId(OS.list("id in ?1", osIds), o -> o.id);
        return rows.stream().map(d -> toDto(d, fcus, oss)).toList();
    }

    private AeroDiretrizDto toDto(AeroDiretriz d) {
        return toDto(d, null, null);
    }

    private AeroDiretrizDto toDto(AeroDiretriz d, Map<Integer, Fcu> fcus, Map<Long, OS> oss) {
        AeroDiretrizDto dto = new AeroDiretrizDto();
        dto.id = d.id;
        dto.tipo = d.tipo != null ? d.tipo.name() : null;
        dto.numero = d.numero;
        dto.titulo = d.titulo;
        dto.emissor = d.emissor;
        dto.ata = d.ata;
        dto.fcuId = d.fcuId;
        if (d.fcuId != null) {
            Fcu fcu = fcus != null ? fcus.get(d.fcuId) : Fcu.findById(d.fcuId);
            if (fcu != null) {
                dto.fcuCodigo = fcu.fcuCodigo;
            }
        }
        dto.partNumber = d.partNumber;
        dto.serialNumber = d.serialNumber;
        dto.dataEmissao = formatDate(d.dataEmissao);
        dto.dataLimiteCumprimento = formatDate(d.dataLimiteCumprimento);
        dto.dataCumprimento = formatDate(d.dataCumprimento);
        dto.status = d.status != null ? d.status.name() : null;
        dto.osCumprimentoId = d.osCumprimentoId;
        if (d.osCumprimentoId != null) {
            OS os = oss != null ? oss.get(d.osCumprimentoId) : OS.findById(d.osCumprimentoId);
            if (os != null) {
                dto.osNumero = os.idOs;
            }
        }
        dto.observacoes = d.observacoes;
        if (d.dataLimiteCumprimento != null) {
            dto.diasParaLimite = (int) ChronoUnit.DAYS.between(LocalDate.now(), d.dataLimiteCumprimento);
            if (d.status == AeroDiretriz.StatusDiretriz.ABERTA
                    || d.status == AeroDiretriz.StatusDiretriz.EM_ANDAMENTO) {
                if (d.dataLimiteCumprimento.isBefore(LocalDate.now())) {
                    dto.severidadeAlerta = "VENCIDA";
                } else if (!d.dataLimiteCumprimento.isAfter(LocalDate.now().plusDays(30))) {
                    dto.severidadeAlerta = "PROXIMA";
                } else {
                    dto.severidadeAlerta = "OK";
                }
            }
        }
        return dto;
    }

    private static LocalDate parseDate(String raw) {
        if (raw == null || raw.isBlank()) {
            return null;
        }
        return LocalDate.parse(raw.trim());
    }

    private static String formatDate(LocalDate d) {
        return d != null ? d.format(D) : null;
    }

    private static String trimOrNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
