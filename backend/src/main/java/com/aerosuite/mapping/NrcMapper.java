package com.aerosuite.mapping;

import com.aerosuite.domain.Nrc;
import com.aerosuite.domain.NrcAcao;
import com.aerosuite.domain.NrcAnexo;
import com.aerosuite.domain.NrcAuditoria;
import com.aerosuite.dto.NrcAberturaUpdateDto;
import com.aerosuite.dto.NrcAcaoDto;
import com.aerosuite.dto.NrcAnexoDto;
import com.aerosuite.dto.NrcAuditoriaDto;
import com.aerosuite.dto.NrcDto;
import com.aerosuite.dto.NrcSummaryDto;
import org.mapstruct.*;

import java.time.LocalDate;
import java.util.List;

@Mapper(componentModel = "cdi")
public interface NrcMapper {

    @Mapping(target = "nrcId", source = "nrc.id")
    NrcAcaoDto toAcaoDto(NrcAcao entity);

    @Mapping(target = "nrcId", source = "nrc.id")
    NrcAnexoDto toAnexoDto(NrcAnexo entity);

    @Mapping(target = "nrcId", source = "nrc.id")
    NrcAuditoriaDto toAuditoriaDto(NrcAuditoria entity);

    @Mapping(target = "vencida", expression = "java(isVencida(entity))")
    @Mapping(target = "etapaAtual", expression = "java(computeEtapa(entity))")
    @Mapping(target = "prontaParaEficacia", expression = "java(isProntaParaEficacia(entity))")
    @Mapping(target = "porquesExtra", expression = "java(parsePorquesExtra(entity.porquesExtra))")
    @Mapping(target = "acoes", source = "acoes")
    @Mapping(target = "anexos", expression = "java(mapAnexos(entity))")
    @Mapping(target = "auditorias", source = "auditorias")
    NrcDto toDto(Nrc entity);

    List<NrcDto> toDtoList(List<Nrc> entities);

    @Mapping(target = "vencida", expression = "java(isVencida(entity))")
    @Mapping(target = "etapaAtual", expression = "java(computeEtapa(entity))")
    @Mapping(target = "prontaParaEficacia", expression = "java(isProntaParaEficacia(entity))")
    @Mapping(target = "aprovacaoEtapa", expression = "java(resolveAprovacaoEtapa(entity))")
    @Mapping(target = "aprovacaoStatus", expression = "java(resolveAprovacaoStatus(entity))")
    @Mapping(target = "aprovacaoPorNome", expression = "java(resolveAprovacaoPorNome(entity))")
    @Mapping(target = "aprovacaoEm", expression = "java(resolveAprovacaoEm(entity))")
    NrcSummaryDto toSummaryDto(Nrc entity);

    List<NrcSummaryDto> toSummaryDtoList(List<Nrc> entities);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "numero", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "dataDeteccao", ignore = true)
    @Mapping(target = "dataUltimaAtualizacao", ignore = true)
    @Mapping(target = "dataEncerramento", ignore = true)
    @Mapping(target = "detectadoPorId", ignore = true)
    @Mapping(target = "detectadoPorNome", ignore = true)
    @Mapping(target = "responsavelTratamentoId", ignore = true)
    @Mapping(target = "responsavelTratamentoNome", ignore = true)
    @Mapping(target = "contencaoAcao", ignore = true)
    @Mapping(target = "contencaoResponsavelId", ignore = true)
    @Mapping(target = "contencaoResponsavelNome", ignore = true)
    @Mapping(target = "contencaoData", ignore = true)
    @Mapping(target = "contencaoNaoAplicavel", ignore = true)
    @Mapping(target = "contencaoOque", ignore = true)
    @Mapping(target = "contencaoQuem", ignore = true)
    @Mapping(target = "contencaoQuando", ignore = true)
    @Mapping(target = "contencaoConcluida", ignore = true)
    @Mapping(target = "contencaoDataConclusao", ignore = true)
    @Mapping(target = "causaRaiz", ignore = true)
    @Mapping(target = "metodoCausa", ignore = true)
    @Mapping(target = "porque1", ignore = true)
    @Mapping(target = "porque2", ignore = true)
    @Mapping(target = "porque3", ignore = true)
    @Mapping(target = "porque4", ignore = true)
    @Mapping(target = "porque5", ignore = true)
    @Mapping(target = "disposicao", ignore = true)
    @Mapping(target = "disposicaoObservacao", ignore = true)
    @Mapping(target = "disposicaoAprovadaPorId", ignore = true)
    @Mapping(target = "disposicaoAprovadaPorNome", ignore = true)
    @Mapping(target = "disposicaoData", ignore = true)
    @Mapping(target = "verificacaoEficacia", ignore = true)
    @Mapping(target = "verificacaoData", ignore = true)
    @Mapping(target = "eficaciaDecisao", ignore = true)
    @Mapping(target = "eficaciaAtualizarRiscos", ignore = true)
    @Mapping(target = "eficaciaMudancasSgq", ignore = true)
    @Mapping(target = "encerradoPorId", ignore = true)
    @Mapping(target = "encerradoPorNome", ignore = true)
    @Mapping(target = "acoes", ignore = true)
    @Mapping(target = "anexos", ignore = true)
    @Mapping(target = "auditorias", ignore = true)
    Nrc toEntity(NrcDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "numero", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "dataDeteccao", ignore = true)
    @Mapping(target = "dataUltimaAtualizacao", ignore = true)
    @Mapping(target = "dataEncerramento", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "detectadoPorId", ignore = true)
    @Mapping(target = "detectadoPorNome", ignore = true)
    @Mapping(target = "responsavelTratamentoId", ignore = true)
    @Mapping(target = "responsavelTratamentoNome", ignore = true)
    @Mapping(target = "contencaoAcao", ignore = true)
    @Mapping(target = "contencaoResponsavelId", ignore = true)
    @Mapping(target = "contencaoResponsavelNome", ignore = true)
    @Mapping(target = "contencaoData", ignore = true)
    @Mapping(target = "contencaoNaoAplicavel", ignore = true)
    @Mapping(target = "contencaoOque", ignore = true)
    @Mapping(target = "contencaoQuem", ignore = true)
    @Mapping(target = "contencaoQuando", ignore = true)
    @Mapping(target = "contencaoConcluida", ignore = true)
    @Mapping(target = "contencaoDataConclusao", ignore = true)
    @Mapping(target = "causaRaiz", ignore = true)
    @Mapping(target = "metodoCausa", ignore = true)
    @Mapping(target = "porque1", ignore = true)
    @Mapping(target = "porque2", ignore = true)
    @Mapping(target = "porque3", ignore = true)
    @Mapping(target = "porque4", ignore = true)
    @Mapping(target = "porque5", ignore = true)
    @Mapping(target = "disposicao", ignore = true)
    @Mapping(target = "disposicaoObservacao", ignore = true)
    @Mapping(target = "disposicaoAprovadaPorId", ignore = true)
    @Mapping(target = "disposicaoAprovadaPorNome", ignore = true)
    @Mapping(target = "disposicaoData", ignore = true)
    @Mapping(target = "verificacaoEficacia", ignore = true)
    @Mapping(target = "verificacaoData", ignore = true)
    @Mapping(target = "eficaciaDecisao", ignore = true)
    @Mapping(target = "eficaciaAtualizarRiscos", ignore = true)
    @Mapping(target = "eficaciaMudancasSgq", ignore = true)
    @Mapping(target = "encerradoPorId", ignore = true)
    @Mapping(target = "encerradoPorNome", ignore = true)
    @Mapping(target = "acoes", ignore = true)
    @Mapping(target = "anexos", ignore = true)
    @Mapping(target = "auditorias", ignore = true)
    void updateEntity(NrcDto dto, @MappingTarget Nrc entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "numero", ignore = true)
    @Mapping(target = "status", ignore = true)
    @Mapping(target = "dataDeteccao", ignore = true)
    @Mapping(target = "dataUltimaAtualizacao", ignore = true)
    @Mapping(target = "dataEncerramento", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "detectadoPorId", ignore = true)
    @Mapping(target = "detectadoPorNome", ignore = true)
    @Mapping(target = "responsavelTratamentoId", ignore = true)
    @Mapping(target = "responsavelTratamentoNome", ignore = true)
    @Mapping(target = "contencaoAcao", ignore = true)
    @Mapping(target = "contencaoResponsavelId", ignore = true)
    @Mapping(target = "contencaoResponsavelNome", ignore = true)
    @Mapping(target = "contencaoData", ignore = true)
    @Mapping(target = "contencaoNaoAplicavel", ignore = true)
    @Mapping(target = "contencaoOque", ignore = true)
    @Mapping(target = "contencaoQuem", ignore = true)
    @Mapping(target = "contencaoQuando", ignore = true)
    @Mapping(target = "contencaoConcluida", ignore = true)
    @Mapping(target = "contencaoDataConclusao", ignore = true)
    @Mapping(target = "causaRaiz", ignore = true)
    @Mapping(target = "metodoCausa", ignore = true)
    @Mapping(target = "porque1", ignore = true)
    @Mapping(target = "porque2", ignore = true)
    @Mapping(target = "porque3", ignore = true)
    @Mapping(target = "porque4", ignore = true)
    @Mapping(target = "porque5", ignore = true)
    @Mapping(target = "disposicao", ignore = true)
    @Mapping(target = "disposicaoObservacao", ignore = true)
    @Mapping(target = "disposicaoAprovadaPorId", ignore = true)
    @Mapping(target = "disposicaoAprovadaPorNome", ignore = true)
    @Mapping(target = "disposicaoData", ignore = true)
    @Mapping(target = "verificacaoEficacia", ignore = true)
    @Mapping(target = "verificacaoData", ignore = true)
    @Mapping(target = "eficaciaDecisao", ignore = true)
    @Mapping(target = "eficaciaAtualizarRiscos", ignore = true)
    @Mapping(target = "eficaciaMudancasSgq", ignore = true)
    @Mapping(target = "encerradoPorId", ignore = true)
    @Mapping(target = "encerradoPorNome", ignore = true)
    @Mapping(target = "acoes", ignore = true)
    @Mapping(target = "anexos", ignore = true)
    @Mapping(target = "auditorias", ignore = true)
    void applyAberturaUpdate(NrcAberturaUpdateDto dto, @MappingTarget Nrc entity);

    default boolean isVencida(Nrc entity) {
        if (entity == null || entity.isEncerrada()) {
            return false;
        }
        LocalDate prazo = entity.prazoTratamento;
        return prazo != null && prazo.isBefore(LocalDate.now());
    }

    default String computeEtapa(Nrc entity) {
        if (entity == null) {
            return "REGISTRO";
        }
        if (entity.isEncerrada()) {
            return "ENCERRADA";
        }
        if ("ABERTA".equals(entity.status)
            && !Boolean.TRUE.equals(entity.contencaoNaoAplicavel)
            && !Boolean.TRUE.equals(entity.contencaoConcluida)) {
            return "REGISTRO";
        }
        if (Boolean.TRUE.equals(entity.contencaoNaoAplicavel)
            || Boolean.TRUE.equals(entity.contencaoConcluida)) {
            if (entity.causaRaiz == null || entity.causaRaiz.isBlank()) {
                return "CAUSA";
            }
            if (!isAnaliseCausaAprovada(entity)) {
                return "CAUSA";
            }
            if (entity.acoes == null || entity.acoes.isEmpty()) {
                return "ACOES";
            }
            boolean allDone = entity.acoes.stream()
                .allMatch(a -> "CONCLUIDA".equals(a.status));
            if (!allDone) {
                return "ACOES";
            }
            if (!isPlanoAcoesAprovado(entity)) {
                return "ACOES";
            }
            return "EFICACIA";
        }
        return "CONTENCAO";
    }

    default boolean isAnaliseCausaAprovada(Nrc entity) {
        if (entity == null) {
            return false;
        }
        return com.aerosuite.util.AnaliseCausaStatus.APROVADO
            == com.aerosuite.util.AnaliseCausaStatus.fromDb(entity.analiseCausaStatus);
    }

    default boolean isProntaParaEficacia(Nrc entity) {
        if (entity == null || entity.isEncerrada()) {
            return false;
        }
        if (entity.causaRaiz == null || entity.causaRaiz.isBlank()) {
            return false;
        }
        if (!isAnaliseCausaAprovada(entity)) {
            return false;
        }
        if (!Boolean.TRUE.equals(entity.contencaoNaoAplicavel)
            && !Boolean.TRUE.equals(entity.contencaoConcluida)) {
            return false;
        }
        if (entity.acoes == null || entity.acoes.isEmpty()) {
            return false;
        }
        if (!entity.acoes.stream().allMatch(a -> "CONCLUIDA".equals(a.status))) {
            return false;
        }
        return isPlanoAcoesAprovado(entity);
    }

    default boolean isPlanoAcoesAprovado(Nrc entity) {
        if (entity == null) {
            return false;
        }
        return com.aerosuite.util.PlanoAcoesStatus.APROVADO
            == com.aerosuite.util.PlanoAcoesStatus.fromDb(entity.acoesPlanoStatus);
    }

    default com.aerosuite.util.NrcAprovacaoResumoUtil.Resumo resolveAprovacaoResumo(Nrc entity) {
        return com.aerosuite.util.NrcAprovacaoResumoUtil.resolve(entity);
    }

    default String resolveAprovacaoEtapa(Nrc entity) {
        com.aerosuite.util.NrcAprovacaoResumoUtil.Resumo resumo = resolveAprovacaoResumo(entity);
        return resumo != null ? resumo.etapa() : null;
    }

    default String resolveAprovacaoStatus(Nrc entity) {
        com.aerosuite.util.NrcAprovacaoResumoUtil.Resumo resumo = resolveAprovacaoResumo(entity);
        return resumo != null ? resumo.status() : null;
    }

    default String resolveAprovacaoPorNome(Nrc entity) {
        com.aerosuite.util.NrcAprovacaoResumoUtil.Resumo resumo = resolveAprovacaoResumo(entity);
        return resumo != null ? resumo.porNome() : null;
    }

    default java.time.LocalDateTime resolveAprovacaoEm(Nrc entity) {
        com.aerosuite.util.NrcAprovacaoResumoUtil.Resumo resumo = resolveAprovacaoResumo(entity);
        return resumo != null ? resumo.em() : null;
    }

    default List<String> parsePorquesExtra(String json) {
        if (json == null || json.isBlank()) {
            return List.of();
        }
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().readValue(
                json, new com.fasterxml.jackson.core.type.TypeReference<List<String>>() {});
        } catch (Exception e) {
            return List.of();
        }
    }

    default String serializePorquesExtra(List<String> items) {
        if (items == null || items.isEmpty()) {
            return null;
        }
        List<String> cleaned = items.stream()
            .map(s -> s != null ? s.trim() : "")
            .filter(s -> !s.isEmpty())
            .toList();
        if (cleaned.isEmpty()) {
            return null;
        }
        try {
            return new com.fasterxml.jackson.databind.ObjectMapper().writeValueAsString(cleaned);
        } catch (Exception e) {
            return null;
        }
    }

    default List<NrcAnexoDto> mapAnexos(Nrc entity) {
        if (entity == null || entity.anexos == null) {
            return List.of();
        }
        return entity.anexos.stream()
            .filter(a -> Boolean.TRUE.equals(a.isActive))
            .map(this::toAnexoDtoEnriched)
            .toList();
    }

    default NrcAnexoDto toAnexoDtoEnriched(NrcAnexo entity) {
        if (entity == null) {
            return null;
        }
        Long nrcId = entity.nrc != null ? entity.nrc.id : null;
        String url = nrcId != null && entity.nomeArquivo != null
            ? "/api/nrc/" + nrcId + "/anexos/" + entity.nomeArquivo
            : null;
        return new NrcAnexoDto(
            entity.id,
            nrcId,
            entity.nomeArquivo,
            entity.nomeOriginal,
            entity.tipoArquivo,
            entity.tamanhoBytes,
            entity.caminhoArquivo,
            url,
            entity.descricao,
            entity.categoria != null ? entity.categoria : "EVIDENCIA",
            entity.usuarioId,
            entity.usuarioNome,
            entity.dataUpload,
            entity.isActive
        );
    }
}
