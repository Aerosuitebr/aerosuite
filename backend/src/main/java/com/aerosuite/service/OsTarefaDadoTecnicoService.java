package com.aerosuite.service;

import com.aerosuite.domain.AeroDiretriz;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OsTarefaDadoTecnico;
import com.aerosuite.domain.PublicacaoTecnica;
import com.aerosuite.dto.OsTarefaDadoTecnicoDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.os.OsRegistroEncerradoGuard;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;

import java.util.ArrayList;
import java.util.List;
import java.util.Locale;
import java.util.Objects;

@ApplicationScoped
public class OsTarefaDadoTecnicoService {

    private static final int MAX_VINCULOS = 50;
    private static final int MIN_TAREFA_CHARS = 3;

    @Inject
    OsRegistroEncerradoGuard registroEncerradoGuard;

    public List<OsTarefaDadoTecnicoDto> listarPorOs(Long osId) {
        if (osId == null) {
            return List.of();
        }
        return OsTarefaDadoTecnico
                .<OsTarefaDadoTecnico>find("osId = ?1 order by ordem asc, id asc", osId)
                .list()
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional
    public void replaceParaOs(Long osId, List<OsTarefaDadoTecnicoDto> incoming, Integer usuarioId) {
        if (osId == null) {
            return;
        }
        OS os = OS.findById(osId);
        if (os == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_NOT_FOUND));
        }
        registroEncerradoGuard.assertMutacaoPermitida(os);

        List<OsTarefaDadoTecnicoDto> rows = incoming != null ? incoming : List.of();
        if (rows.size() > MAX_VINCULOS) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_LIMITE));
        }

        OsTarefaDadoTecnico.delete("osId", osId);
        int ordem = 0;
        for (OsTarefaDadoTecnicoDto dto : rows) {
            validateRow(dto);
            OsTarefaDadoTecnico row = new OsTarefaDadoTecnico();
            row.osId = osId;
            row.ordem = dto.ordem != null ? dto.ordem : ordem++;
            row.tarefaDescricao = dto.tarefaDescricao.trim();
            row.tipoDado = OsTarefaDadoTecnico.TipoDado.valueOf(dto.tipoDado.trim().toUpperCase(Locale.ROOT));
            row.observacao = trimOrNull(dto.observacao);
            row.createdByUsuarioId = usuarioId;
            enrichReferencias(row, dto);
            row.persist();
        }
    }

    void validateRow(OsTarefaDadoTecnicoDto dto) {
        if (dto == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_INVALIDO));
        }
        if (dto.tipoDado == null || dto.tipoDado.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_TIPO_OBRIGATORIO));
        }
        if (dto.tarefaDescricao == null || dto.tarefaDescricao.trim().length() < MIN_TAREFA_CHARS) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_DESCRICAO_OBRIGATORIA));
        }
        OsTarefaDadoTecnico.TipoDado tipo;
        try {
            tipo = OsTarefaDadoTecnico.TipoDado.valueOf(dto.tipoDado.trim().toUpperCase(Locale.ROOT));
        } catch (IllegalArgumentException e) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_TIPO_INVALIDO));
        }
        switch (tipo) {
            case AD_SB -> {
                if (dto.aeroDiretrizId == null) {
                    throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_AD_OBRIGATORIO));
                }
            }
            case MANUAL -> {
                if (dto.publicacaoTecnicaId == null) {
                    throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_MANUAL_OBRIGATORIO));
                }
            }
            case OUTRO -> {
                if (dto.referenciaExterna == null || dto.referenciaExterna.trim().length() < MIN_TAREFA_CHARS) {
                    throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_REF_OBRIGATORIA));
                }
            }
        }
    }

    private void enrichReferencias(OsTarefaDadoTecnico row, OsTarefaDadoTecnicoDto dto) {
        switch (row.tipoDado) {
            case AD_SB -> {
                AeroDiretriz dir = AeroDiretriz.findById(dto.aeroDiretrizId);
                if (dir == null) {
                    throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_AD_NAO_ENCONTRADO));
                }
                row.aeroDiretrizId = dir.id;
                row.numeroExibicao = dir.numero;
                row.tituloExibicao = dir.titulo;
            }
            case MANUAL -> {
                PublicacaoTecnica pub = PublicacaoTecnica.findById(dto.publicacaoTecnicaId);
                if (pub == null || pub.isActive == null || !pub.isActive) {
                    throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_TAREFA_DT_MANUAL_NAO_ENCONTRADO));
                }
                row.publicacaoTecnicaId = pub.id;
                row.numeroExibicao = pub.numeroRevisao;
                row.tituloExibicao = pub.tipoManual;
            }
            case OUTRO -> {
                row.referenciaExterna = dto.referenciaExterna.trim();
                row.tituloExibicao = row.referenciaExterna;
                row.numeroExibicao = null;
            }
        }
    }

    OsTarefaDadoTecnicoDto toDto(OsTarefaDadoTecnico e) {
        OsTarefaDadoTecnicoDto d = new OsTarefaDadoTecnicoDto();
        d.id = e.id;
        d.ordem = e.ordem;
        d.tarefaDescricao = e.tarefaDescricao;
        d.tipoDado = e.tipoDado != null ? e.tipoDado.name() : null;
        d.aeroDiretrizId = e.aeroDiretrizId;
        d.publicacaoTecnicaId = e.publicacaoTecnicaId;
        d.referenciaExterna = e.referenciaExterna;
        d.tituloExibicao = e.tituloExibicao;
        d.numeroExibicao = e.numeroExibicao;
        d.observacao = e.observacao;
        return d;
    }

    private static String trimOrNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }

    public void attachToDto(com.aerosuite.dto.OSDto dto, Long osId) {
        if (dto == null || osId == null) {
            return;
        }
        dto.tarefasDadosTecnicos = new ArrayList<>(listarPorOs(osId));
    }

    public void attachBatch(List<com.aerosuite.dto.OSDto> dtos) {
        if (dtos == null || dtos.isEmpty()) {
            return;
        }
        List<Long> osIds = dtos.stream()
                .map(d -> d.id)
                .filter(Objects::nonNull)
                .distinct()
                .toList();
        if (osIds.isEmpty()) {
            return;
        }
        List<OsTarefaDadoTecnico> all =
                OsTarefaDadoTecnico.find("osId in ?1 order by osId asc, ordem asc, id asc", osIds).list();
        var byOs = all.stream().collect(java.util.stream.Collectors.groupingBy(r -> r.osId));
        for (com.aerosuite.dto.OSDto dto : dtos) {
            if (dto.id == null) {
                dto.tarefasDadosTecnicos = List.of();
                continue;
            }
            dto.tarefasDadosTecnicos =
                    byOs.getOrDefault(dto.id, List.of()).stream().map(this::toDto).toList();
        }
    }
}
