package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeNaoConformidade;
import com.aerosuite.domain.ConformidadeNaoConformidade.CapaFase;
import com.aerosuite.domain.ConformidadeNcAnexo;
import com.aerosuite.domain.ConformidadeNcCapaEtapa;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.ConformidadeNcAprovacaoWriteDto;
import com.aerosuite.dto.ConformidadeNcCapaEtapaDto;
import com.aerosuite.dto.ConformidadeNcCapaEtapaWriteDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.service.conformidade.ConformidadeDateUtil;
import io.quarkus.panache.common.Sort;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class ConformidadeNcCapaEtapaService {

    private static final List<CapaFase> ORDEM =
            Arrays.asList(
                    CapaFase.REGISTRO,
                    CapaFase.CONTENCAO,
                    CapaFase.CAUSA,
                    CapaFase.ACAO,
                    CapaFase.VERIFICACAO,
                    CapaFase.FECHADA);

    @Inject
    InternalUserContext userContext;

    @Inject
    ConformidadeNcNotificacaoService ncNotificacaoService;

    public List<ConformidadeNcCapaEtapaDto> listar(Long ncId) {
        ensureEtapas(ncId);
        List<ConformidadeNcCapaEtapa> rows =
                ConformidadeNcCapaEtapa.find("ncId = ?1", Sort.by("id").ascending(), ncId).list();
        rows.sort((a, b) -> Integer.compare(ORDEM.indexOf(a.fase), ORDEM.indexOf(b.fase)));
        return toDtoList(rows);
    }

    @Transactional
    public void ensureEtapas(Long ncId) {
        requireNc(ncId);
        for (CapaFase fase : ORDEM) {
            long count = ConformidadeNcCapaEtapa.count("ncId = ?1 and fase = ?2", ncId, fase);
            if (count == 0) {
                ConformidadeNcCapaEtapa row = new ConformidadeNcCapaEtapa();
                row.ncId = ncId;
                row.fase = fase;
                row.persist();
            }
        }
    }

    @Transactional
    public void aplicarResponsaveis(Long ncId, List<ConformidadeNcCapaEtapaWriteDto> etapas) {
        if (etapas == null || etapas.isEmpty()) {
            return;
        }
        ensureEtapas(ncId);
        ConformidadeNaoConformidade nc = requireNc(ncId);
        Integer autorId = userContext.getUserId();
        for (ConformidadeNcCapaEtapaWriteDto write : etapas) {
            if (write == null || write.fase == null || write.fase.isBlank()) {
                continue;
            }
            CapaFase fase = CapaFase.valueOf(write.fase.trim().toUpperCase(Locale.ROOT));
            ConformidadeNcCapaEtapa row =
                    ConformidadeNcCapaEtapa.find("ncId = ?1 and fase = ?2", ncId, fase).firstResult();
            if (row == null) {
                row = new ConformidadeNcCapaEtapa();
                row.ncId = ncId;
                row.fase = fase;
            }
            Integer responsavelAnterior = row.responsavelUsuarioId;
            if (write.responsavelUsuarioId != null) {
                Usuario u = Usuario.findById(write.responsavelUsuarioId);
                if (u == null) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.responsavel_invalido"));
                }
                if (Boolean.TRUE.equals(row.aprovado)
                        && responsavelAnterior != null
                        && !responsavelAnterior.equals(write.responsavelUsuarioId)) {
                    limparAprovacao(row);
                }
                row.responsavelUsuarioId = u.id;
                row.responsavelUsuarioNome = u.nome != null ? u.nome : u.email;
            }
            row.prazo = ConformidadeDateUtil.parseDate(write.prazo);
            row.persist();
            if (write.responsavelUsuarioId != null
                    && !Boolean.TRUE.equals(row.aprovado)
                    && !write.responsavelUsuarioId.equals(responsavelAnterior)) {
                ncNotificacaoService.notificarFasePendente(nc, fase, write.responsavelUsuarioId, autorId);
            }
        }
    }

    @Transactional
    public ConformidadeNcCapaEtapaDto aprovar(Long ncId, String faseStr, ConformidadeNcAprovacaoWriteDto body) {
        ConformidadeNaoConformidade nc = requireNc(ncId);
        CapaFase fase = parseFase(faseStr);
        ensureEtapas(ncId);
        ConformidadeNcCapaEtapa row =
                ConformidadeNcCapaEtapa.find("ncId = ?1 and fase = ?2", ncId, fase).firstResult();
        if (row == null) {
            throw new NotFoundException(ApiI18nMessages.domain("nc.error.etapa_nao_encontrada"));
        }
        validarPreAprovacao(nc, row);
        Integer uid = userContext.getUserId();
        if (uid == null) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.usuario_obrigatorio"));
        }
        row.aprovado = true;
        row.aprovadoUsuarioId = uid;
        row.aprovadoUsuarioNome = userContext.getNome();
        row.aprovadoEm = LocalDateTime.now();
        row.aprovacaoObservacao = body != null ? body.observacao : null;
        row.persist();
        notificarProximaFasePendente(nc, fase, uid);
        return toDto(row);
    }

    private void notificarProximaFasePendente(ConformidadeNaoConformidade nc, CapaFase faseAprovada, Integer autorId) {
        int idx = ORDEM.indexOf(faseAprovada);
        if (idx < 0 || idx >= ORDEM.size() - 2) {
            return;
        }
        CapaFase proxima = ORDEM.get(idx + 1);
        if (proxima == CapaFase.FECHADA) {
            return;
        }
        ConformidadeNcCapaEtapa next =
                ConformidadeNcCapaEtapa.find("ncId = ?1 and fase = ?2", nc.id, proxima).firstResult();
        if (next != null
                && next.responsavelUsuarioId != null
                && !Boolean.TRUE.equals(next.aprovado)) {
            ncNotificacaoService.notificarFasePendente(nc, proxima, next.responsavelUsuarioId, autorId);
        }
    }

    @Transactional
    public ConformidadeNcCapaEtapaDto rejeitar(Long ncId, String faseStr, ConformidadeNcAprovacaoWriteDto body) {
        CapaFase fase = parseFase(faseStr);
        ConformidadeNcCapaEtapa row =
                ConformidadeNcCapaEtapa.find("ncId = ?1 and fase = ?2", ncId, fase).firstResult();
        if (row == null) {
            throw new NotFoundException(ApiI18nMessages.domain("nc.error.etapa_nao_encontrada"));
        }
        limparAprovacao(row);
        if (body != null && body.observacao != null && !body.observacao.isBlank()) {
            row.aprovacaoObservacao = body.observacao.trim();
        }
        row.persist();
        return toDto(row);
    }

    public void validarFechamento(ConformidadeNaoConformidade nc) {
        ensureEtapas(nc.id);
        for (CapaFase fase : List.of(CapaFase.REGISTRO, CapaFase.CONTENCAO, CapaFase.CAUSA, CapaFase.ACAO, CapaFase.VERIFICACAO)) {
            ConformidadeNcCapaEtapa row =
                    ConformidadeNcCapaEtapa.find("ncId = ?1 and fase = ?2", nc.id, fase).firstResult();
            if (row == null || !Boolean.TRUE.equals(row.aprovado)) {
                throw new BadRequestException(ApiI18nMessages.domain("nc.error.etapas_pendentes_aprovacao"));
            }
        }
    }

    public void validarAvancoFase(ConformidadeNaoConformidade nc, CapaFase novaFase) {
        int novoIdx = ORDEM.indexOf(novaFase);
        if (novoIdx <= 0) {
            return;
        }
        ensureEtapas(nc.id);
        for (int i = 0; i < novoIdx; i++) {
            CapaFase faseAnterior = ORDEM.get(i);
            if (faseAnterior == CapaFase.FECHADA) {
                continue;
            }
            ConformidadeNcCapaEtapa row =
                    ConformidadeNcCapaEtapa.find("ncId = ?1 and fase = ?2", nc.id, faseAnterior).firstResult();
            if (row == null || !Boolean.TRUE.equals(row.aprovado)) {
                throw new BadRequestException(ApiI18nMessages.domain("nc.error.fase_anterior_nao_aprovada"));
            }
        }
    }

    @Transactional
    public void aprovarFechamentoAutomatico(Long ncId) {
        ConformidadeNcCapaEtapa row =
                ConformidadeNcCapaEtapa.find("ncId = ?1 and fase = ?2", ncId, CapaFase.FECHADA).firstResult();
        if (row == null) {
            return;
        }
        Integer uid = userContext.getUserId();
        row.aprovado = true;
        row.aprovadoUsuarioId = uid;
        row.aprovadoUsuarioNome = userContext.getNome();
        row.aprovadoEm = LocalDateTime.now();
        row.persist();
    }

    private void validarPreAprovacao(ConformidadeNaoConformidade nc, ConformidadeNcCapaEtapa row) {
        int idx = ORDEM.indexOf(row.fase);
        if (idx > 0) {
            for (int i = 0; i < idx; i++) {
                CapaFase anterior = ORDEM.get(i);
                ConformidadeNcCapaEtapa prev =
                        ConformidadeNcCapaEtapa.find("ncId = ?1 and fase = ?2", nc.id, anterior).firstResult();
                if (prev == null || !Boolean.TRUE.equals(prev.aprovado)) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.fase_anterior_nao_aprovada"));
                }
            }
        }
        if (row.responsavelUsuarioId == null && row.fase != CapaFase.REGISTRO) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.responsavel_obrigatorio"));
        }
        switch (row.fase) {
            case REGISTRO -> {
                if (nc.titulo == null || nc.titulo.isBlank()) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.conteudo_fase_incompleto"));
                }
            }
            case CONTENCAO -> {
                if (nc.acaoContencao == null || nc.acaoContencao.isBlank()) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.conteudo_fase_incompleto"));
                }
            }
            case CAUSA -> {
                if (nc.causaRaiz == null || nc.causaRaiz.isBlank()) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.conteudo_fase_incompleto"));
                }
            }
            case ACAO -> {
                if (nc.acaoCorretiva == null || nc.acaoCorretiva.isBlank()) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.conteudo_fase_incompleto"));
                }
            }
            case VERIFICACAO -> {
                if (nc.verificacaoEficacia == null || nc.verificacaoEficacia.isBlank()) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.conteudo_fase_incompleto"));
                }
                if (!Boolean.TRUE.equals(nc.eficaciaConfirmada)) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.eficacia_obrigatoria"));
                }
                long anexos =
                        ConformidadeNcAnexo.count(
                                "ncId = ?1 and ativo = true and capaFase = ?2", nc.id, CapaFase.VERIFICACAO);
                if (anexos == 0) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.anexo_evidencia_obrigatorio"));
                }
            }
            case FECHADA -> {
                if (nc.dataFechamento == null) {
                    throw new BadRequestException(ApiI18nMessages.domain("nc.error.conteudo_fase_incompleto"));
                }
            }
            default -> {}
        }
    }

    private void limparAprovacao(ConformidadeNcCapaEtapa row) {
        row.aprovado = false;
        row.aprovadoUsuarioId = null;
        row.aprovadoUsuarioNome = null;
        row.aprovadoEm = null;
    }

    private CapaFase parseFase(String faseStr) {
        if (faseStr == null || faseStr.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.capa_fase_invalida"));
        }
        try {
            return CapaFase.valueOf(faseStr.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.capa_fase_invalida"));
        }
    }

    private ConformidadeNaoConformidade requireNc(Long ncId) {
        if (ncId == null) {
            throw new BadRequestException(ApiI18nMessages.domain("nc.error.id_invalido"));
        }
        ConformidadeNaoConformidade nc = ConformidadeNaoConformidade.findById(ncId);
        if (nc == null) {
            throw new NotFoundException(ApiI18nMessages.domain("nc.error.nao_encontrada"));
        }
        return nc;
    }

    private List<ConformidadeNcCapaEtapaDto> toDtoList(List<ConformidadeNcCapaEtapa> rows) {
        List<ConformidadeNcCapaEtapaDto> out = new ArrayList<>();
        for (ConformidadeNcCapaEtapa row : rows) {
            out.add(toDto(row));
        }
        return out;
    }

    private ConformidadeNcCapaEtapaDto toDto(ConformidadeNcCapaEtapa row) {
        ConformidadeNcCapaEtapaDto dto = new ConformidadeNcCapaEtapaDto();
        dto.fase = row.fase != null ? row.fase.name() : null;
        dto.responsavelUsuarioId = row.responsavelUsuarioId;
        dto.responsavelUsuarioNome = row.responsavelUsuarioNome;
        dto.prazo = ConformidadeDateUtil.formatDate(row.prazo);
        dto.aprovado = row.aprovado;
        dto.aprovadoUsuarioId = row.aprovadoUsuarioId;
        dto.aprovadoUsuarioNome = row.aprovadoUsuarioNome;
        dto.aprovadoEm = row.aprovadoEm != null ? row.aprovadoEm.toString() : null;
        dto.aprovacaoObservacao = row.aprovacaoObservacao;
        return dto;
    }
}
