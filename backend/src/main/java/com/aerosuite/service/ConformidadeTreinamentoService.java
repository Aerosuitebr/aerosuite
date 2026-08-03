package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeTreinamento;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.*;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.service.conformidade.ConformidadeDateUtil;
import com.aerosuite.util.PanacheMaps;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class ConformidadeTreinamentoService {

    @Inject
    TenantDataAccess tenantDataAccess;

    public PageResponse<ConformidadeTreinamentoDto> listar(
            int page, int size, String q, Integer usuarioId, Boolean somenteAtivos) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (somenteAtivos == null || somenteAtivos) {
            jpql.append(" and ativo = true");
        }
        if (usuarioId != null) {
            jpql.append(" and usuarioId = ?").append(idx++);
            params.add(usuarioId);
        }
        if (q != null && !q.isBlank()) {
            String needle = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            jpql.append(" and (lower(curso) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(certificador) like ?").append(idx++);
            params.add(needle);
            jpql.append(
                    " or usuarioId in (select u.id from Usuario u where lower(u.nome) like ?")
                    .append(idx++);
            params.add(needle);
            jpql.append(" or lower(u.email) like ?").append(idx++).append("))");
            params.add(needle);
        }
        long total = ConformidadeTreinamento.find(jpql.toString(), params.toArray()).count();
        List<ConformidadeTreinamento> rows =
                ConformidadeTreinamento.find(jpql.toString(), Sort.by("dataValidade").ascending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(toDtoList(rows), total, totalPages, page, size, null);
    }

    public ConformidadeAlertasResumoDto alertas(int diasJanela) {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        ConformidadeAlertasResumoDto resumo = new ConformidadeAlertasResumoDto();
        resumo.diasJanela = janela;
        for (ConformidadeTreinamentoDto dto : toDtoList(
                ConformidadeTreinamento.find("ativo = true and dataValidade is not null order by dataValidade asc")
                        .list())) {
            if ("VENCIDA".equals(dto.severidadeAlerta)) {
                resumo.totalVencidas++;
                resumo.itens.add(dto);
            } else if ("PROXIMA".equals(dto.severidadeAlerta)) {
                resumo.totalProximas++;
                resumo.itens.add(dto);
            }
        }
        resumo.totalAtivos = ConformidadeTreinamento.count("ativo = true");
        return resumo;
    }

    public ConformidadeTreinamentoDto obter(Long id) {
        return toDto(require(id));
    }

    @Transactional
    public ConformidadeTreinamentoDto criar(ConformidadeTreinamentoWriteDto body) {
        validateWrite(body, true);
        ConformidadeTreinamento t = new ConformidadeTreinamento();
        applyWrite(t, body);
        t.persist();
        return toDto(t);
    }

    @Transactional
    public ConformidadeTreinamentoDto atualizar(Long id, ConformidadeTreinamentoWriteDto body) {
        validateWrite(body, false);
        ConformidadeTreinamento t = require(id);
        applyWrite(t, body);
        t.persist();
        return toDto(t);
    }

    @Transactional
    public void excluir(Long id) {
        require(id).delete();
    }

    private ConformidadeTreinamento require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("treinamento.error.id_invalido"));
        }
        ConformidadeTreinamento t = ConformidadeTreinamento.findById(id);
        if (t == null) {
            throw new NotFoundException(ApiI18nMessages.domain("treinamento.error.nao_encontrado"));
        }
        return t;
    }

    private Usuario requireUsuario(Integer usuarioId) {
        if (usuarioId == null) {
            throw new BadRequestException(ApiI18nMessages.domain("treinamento.error.usuario_obrigatorio"));
        }
        Usuario u = Usuario.findById(usuarioId);
        if (u == null || u.orgTenantId == null || !u.orgTenantId.equals(tenantDataAccess.currentTenantId())) {
            throw new NotFoundException(ApiI18nMessages.domain("treinamento.error.usuario_nao_encontrado"));
        }
        return u;
    }

    private void validateWrite(ConformidadeTreinamentoWriteDto body, boolean create) {
        if (body == null || body.curso == null || body.curso.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("treinamento.error.campos_obrigatorios"));
        }
        if (create) {
            requireUsuario(body.usuarioId);
        }
    }

    private void applyWrite(ConformidadeTreinamento t, ConformidadeTreinamentoWriteDto body) {
        if (body.usuarioId != null) {
            t.usuarioId = body.usuarioId;
        }
        t.curso = body.curso.trim();
        t.cargaHoraria = body.cargaHoraria;
        t.dataConclusao = ConformidadeDateUtil.parseDate(body.dataConclusao);
        t.dataValidade = ConformidadeDateUtil.parseDate(body.dataValidade);
        t.certificador = body.certificador;
        t.observacoes = body.observacoes;
        if (body.turmaRef != null) {
            t.turmaRef = body.turmaRef.isBlank() ? null : body.turmaRef.trim();
        }
        if (body.presenteLista != null) {
            t.presenteLista = body.presenteLista;
        }
        if (body.ativo != null) {
            t.ativo = body.ativo;
        }
    }

    private List<ConformidadeTreinamentoDto> toDtoList(List<ConformidadeTreinamento> rows) {
        Set<Integer> usuarioIds =
                rows.stream().map(r -> r.usuarioId).filter(Objects::nonNull).collect(Collectors.toSet());
        Map<Integer, Usuario> usuarios =
                usuarioIds.isEmpty()
                        ? Map.of()
                        : PanacheMaps.byId(Usuario.list("id in ?1", usuarioIds), u -> u.id);
        List<ConformidadeTreinamentoDto> out = new ArrayList<>();
        for (ConformidadeTreinamento row : rows) {
            out.add(toDto(row, usuarios.get(row.usuarioId)));
        }
        return out;
    }

    private ConformidadeTreinamentoDto toDto(ConformidadeTreinamento t) {
        Usuario u = t.usuarioId != null ? Usuario.findById(t.usuarioId) : null;
        return toDto(t, u);
    }

    private ConformidadeTreinamentoDto toDto(ConformidadeTreinamento t, Usuario u) {
        ConformidadeTreinamentoDto dto = new ConformidadeTreinamentoDto();
        dto.id = t.id;
        dto.usuarioId = t.usuarioId;
        if (u != null) {
            dto.usuarioNome = u.nome;
        }
        dto.curso = t.curso;
        dto.cargaHoraria = t.cargaHoraria;
        dto.dataConclusao = ConformidadeDateUtil.formatDate(t.dataConclusao);
        dto.dataValidade = ConformidadeDateUtil.formatDate(t.dataValidade);
        dto.certificador = t.certificador;
        dto.observacoes = t.observacoes;
        dto.turmaRef = t.turmaRef;
        dto.presenteLista = t.presenteLista;
        dto.ativo = Boolean.TRUE.equals(t.ativo);
        ConformidadeDateUtil.applyAlerta(t.dataValidade, 60, (sev, dias) -> {
            dto.severidadeAlerta = sev;
            dto.diasParaValidade = dias;
        });
        return dto;
    }
}
