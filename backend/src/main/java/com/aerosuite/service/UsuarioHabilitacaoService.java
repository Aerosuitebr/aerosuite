package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.crs.Part145CrsSegregation;
import com.aerosuite.domain.Usuario;
import com.aerosuite.domain.UsuarioHabilitacaoTecnica;
import com.aerosuite.domain.UsuarioHabilitacaoTecnica.TipoHabilitacao;
import com.aerosuite.dto.*;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.FieldLengthValidator;
import com.aerosuite.util.PanacheMaps;
import io.quarkus.panache.common.Page;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class UsuarioHabilitacaoService {

    public static final String ERROR_CRS_SEM_HABILITACAO = "crs.error.habilitacao.invalida";

    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;

    @Inject
    TenantDataAccess tenantDataAccess;

    public PageResponse<UsuarioHabilitacaoDto> listar(
            int page, int size, String q, String tipo, Integer usuarioId, Boolean somenteAtivas) {
        StringBuilder jpql = new StringBuilder("1=1");
        List<Object> params = new ArrayList<>();
        int idx = 1;
        if (somenteAtivas == null || somenteAtivas) {
            jpql.append(" and ativo = true");
        }
        if (tipo != null && !tipo.isBlank()) {
            jpql.append(" and tipo = ?").append(idx++);
            params.add(TipoHabilitacao.valueOf(tipo.trim().toUpperCase(Locale.ROOT)));
        }
        if (usuarioId != null) {
            jpql.append(" and usuarioId = ?").append(idx++);
            params.add(usuarioId);
        }
        if (q != null && !q.isBlank()) {
            String needle = "%" + q.trim().toLowerCase(Locale.ROOT) + "%";
            jpql.append(" and (lower(escopo) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(identificador) like ?").append(idx++);
            params.add(needle);
            jpql.append(" or lower(emissor) like ?").append(idx++);
            params.add(needle);
            jpql.append(
                    " or usuarioId in (select u.id from Usuario u where lower(u.nome) like ?")
                    .append(idx++);
            params.add(needle);
            jpql.append(" or lower(u.email) like ?").append(idx++).append("))");
            params.add(needle);
        }
        long total = UsuarioHabilitacaoTecnica.find(jpql.toString(), params.toArray()).count();
        List<UsuarioHabilitacaoTecnica> rows =
                UsuarioHabilitacaoTecnica.find(jpql.toString(), Sort.by("dataValidade").ascending(), params.toArray())
                        .page(Page.of(page, size))
                        .list();
        List<UsuarioHabilitacaoDto> dtos = toDtoList(rows);
        int totalPages = size > 0 ? (int) Math.ceil((double) total / size) : 0;
        return new PageResponse<>(dtos, total, totalPages, page, size, null);
    }

    public UsuarioHabilitacaoAlertasResumoDto alertas(int diasJanela) {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        LocalDate hoje = LocalDate.now();
        LocalDate limite = hoje.plusDays(janela);

        List<UsuarioHabilitacaoTecnica> rows =
                UsuarioHabilitacaoTecnica.find(
                                "ativo = true and dataValidade is not null order by dataValidade asc")
                        .list();

        UsuarioHabilitacaoAlertasResumoDto resumo = new UsuarioHabilitacaoAlertasResumoDto();
        resumo.diasJanela = janela;
        for (UsuarioHabilitacaoDto dto : toDtoList(rows)) {
            LocalDate validade = parseDate(dto.dataValidade);
            if (validade == null) {
                continue;
            }
            if (validade.isBefore(hoje)) {
                dto.severidadeAlerta = "VENCIDA";
                resumo.totalVencidas++;
                resumo.itens.add(dto);
            } else if (!validade.isAfter(limite)) {
                dto.severidadeAlerta = "PROXIMA";
                resumo.totalProximas++;
                resumo.itens.add(dto);
            }
        }
        resumo.totalAtivas = UsuarioHabilitacaoTecnica.count("ativo = true");
        return resumo;
    }

    public List<UsuarioHabilitacaoDto> porUsuario(Integer usuarioId) {
        requireUsuario(usuarioId);
        return toDtoList(UsuarioHabilitacaoTecnica.<UsuarioHabilitacaoTecnica>find(
                        "usuarioId = ?1 order by dataValidade asc, id desc", usuarioId)
                .list());
    }

    public UsuarioHabilitacaoDto obter(Long id) {
        return toDto(require(id));
    }

    @Transactional
    public UsuarioHabilitacaoDto criar(UsuarioHabilitacaoWriteDto body) {
        validateWrite(body, true);
        UsuarioHabilitacaoTecnica h = new UsuarioHabilitacaoTecnica();
        applyWrite(h, body);
        h.persist();
        return toDto(h);
    }

    @Transactional
    public UsuarioHabilitacaoDto atualizar(Long id, UsuarioHabilitacaoWriteDto body) {
        validateWrite(body, false);
        UsuarioHabilitacaoTecnica h = require(id);
        applyWrite(h, body);
        h.persist();
        return toDto(h);
    }

    @Transactional
    public void excluir(Long id) {
        require(id).delete();
    }

    /**
     * Exige habilitação RT ou inspetor válida para emissão de CRS (exceto perfis de bypass administrativo).
     */
    public void assertHabilitacaoValidaParaCrs(Integer userId, String perfilCodigo) {
        if (Part145CrsSegregation.bypassesHabilitacaoCrs(perfilCodigo)) {
            return;
        }
        if (userId == null) {
            throw new BadRequestException(ERROR_CRS_SEM_HABILITACAO);
        }
        LocalDate hoje = LocalDate.now();
        boolean ok =
                UsuarioHabilitacaoTecnica.<UsuarioHabilitacaoTecnica>find(
                                "usuarioId = ?1 and ativo = true and tipo in (?2, ?3)",
                                userId,
                                TipoHabilitacao.RT,
                                TipoHabilitacao.INSPETOR)
                        .stream()
                        .anyMatch(
                                h ->
                                        h.dataValidade != null
                                                && !h.dataValidade.isBefore(hoje));
        if (!ok) {
            throw new BadRequestException(ERROR_CRS_SEM_HABILITACAO);
        }
    }

    private UsuarioHabilitacaoTecnica require(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("habilitacao.error.id_invalido"));
        }
        UsuarioHabilitacaoTecnica h = UsuarioHabilitacaoTecnica.findById(id);
        if (h == null) {
            throw new NotFoundException(ApiI18nMessages.domain("habilitacao.error.nao_encontrada"));
        }
        return h;
    }

    private Usuario requireUsuario(Integer usuarioId) {
        if (usuarioId == null) {
            throw new BadRequestException(ApiI18nMessages.domain("habilitacao.error.usuario_obrigatorio"));
        }
        Usuario u = Usuario.findById(usuarioId);
        if (u == null || u.orgTenantId == null || !u.orgTenantId.equals(tenantDataAccess.currentTenantId())) {
            throw new NotFoundException(ApiI18nMessages.domain("habilitacao.error.usuario_nao_encontrado"));
        }
        return u;
    }

    private void validateWrite(UsuarioHabilitacaoWriteDto body, boolean create) {
        if (body == null) {
            throw new BadRequestException(ApiI18nMessages.domain("habilitacao.error.payload_vazio"));
        }
        if (create) {
            requireUsuario(body.usuarioId);
        }
        if (body.tipo != null && !body.tipo.isBlank()) {
            try {
                TipoHabilitacao.valueOf(body.tipo.trim().toUpperCase(Locale.ROOT));
            } catch (IllegalArgumentException e) {
                throw new BadRequestException(ApiI18nMessages.domain("habilitacao.error.tipo_invalido"));
            }
        }
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.identificador), 120, "identificador");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.escopo), 255, "escopo");
        FieldLengthValidator.requireMax(FieldLengthValidator.trimToNull(body.emissor), 120, "emissor");
    }

    private void applyWrite(UsuarioHabilitacaoTecnica h, UsuarioHabilitacaoWriteDto body) {
        if (body.usuarioId != null) {
            h.usuarioId = body.usuarioId;
        }
        if (body.tipo != null && !body.tipo.isBlank()) {
            h.tipo = TipoHabilitacao.valueOf(body.tipo.trim().toUpperCase(Locale.ROOT));
        } else if (h.tipo == null) {
            h.tipo = TipoHabilitacao.MECANICO;
        }
        if (body.escopo != null) {
            h.escopo = FieldLengthValidator.trimRequireMax(body.escopo, 255, "escopo");
        }
        if (body.identificador != null) {
            h.identificador = FieldLengthValidator.trimRequireMax(body.identificador, 120, "identificador");
        }
        if (body.emissor != null) {
            h.emissor = FieldLengthValidator.trimRequireMax(body.emissor, 120, "emissor");
        }
        if (body.dataEmissao != null) {
            h.dataEmissao = parseDate(body.dataEmissao);
        }
        if (body.dataValidade != null) {
            h.dataValidade = parseDate(body.dataValidade);
        }
        if (body.observacoes != null) {
            h.observacoes = trimOrNull(body.observacoes);
        }
        if (body.ativo != null) {
            h.ativo = body.ativo;
        }
    }

    private List<UsuarioHabilitacaoDto> toDtoList(List<UsuarioHabilitacaoTecnica> rows) {
        if (rows == null || rows.isEmpty()) {
            return List.of();
        }
        Set<Integer> usuarioIds = rows.stream()
                .map(h -> h.usuarioId)
                .filter(Objects::nonNull)
                .collect(Collectors.toSet());
        Map<Integer, Usuario> usuarios = usuarioIds.isEmpty()
                ? Map.of()
                : PanacheMaps.<Usuario, Integer>byId(Usuario.list("id in ?1", usuarioIds), u -> u.id);
        return rows.stream().map(h -> toDto(h, usuarios)).toList();
    }

    private UsuarioHabilitacaoDto toDto(UsuarioHabilitacaoTecnica h) {
        return toDto(h, null);
    }

    private UsuarioHabilitacaoDto toDto(UsuarioHabilitacaoTecnica h, Map<Integer, Usuario> usuarios) {
        UsuarioHabilitacaoDto dto = new UsuarioHabilitacaoDto();
        dto.id = h.id;
        dto.usuarioId = h.usuarioId;
        Usuario u = usuarios != null ? usuarios.get(h.usuarioId) : Usuario.findById(h.usuarioId);
        if (u != null) {
            dto.usuarioNome = u.nome;
            dto.usuarioEmail = u.email;
        }
        dto.tipo = h.tipo != null ? h.tipo.name() : null;
        dto.escopo = h.escopo;
        dto.identificador = h.identificador;
        dto.emissor = h.emissor;
        dto.dataEmissao = formatDate(h.dataEmissao);
        dto.dataValidade = formatDate(h.dataValidade);
        dto.observacoes = h.observacoes;
        dto.ativo = Boolean.TRUE.equals(h.ativo);
        if (h.dataValidade != null && dto.ativo) {
            dto.diasParaValidade = (int) ChronoUnit.DAYS.between(LocalDate.now(), h.dataValidade);
            if (h.dataValidade.isBefore(LocalDate.now())) {
                dto.severidadeAlerta = "VENCIDA";
            } else if (!h.dataValidade.isAfter(LocalDate.now().plusDays(60))) {
                dto.severidadeAlerta = "PROXIMA";
            } else {
                dto.severidadeAlerta = "OK";
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
