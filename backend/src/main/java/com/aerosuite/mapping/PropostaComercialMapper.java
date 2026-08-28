package com.aerosuite.mapping;

import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.dto.PropostaComercialDto;
import com.aerosuite.util.DisplayTextRepair;
import org.mapstruct.*;

/**
 * Mapper para PropostaComercial
 * IMPORTANTE: O relacionamento 'itens' é gerenciado manualmente no Service,
 * não pelo MapStruct, para evitar problemas com relacionamentos LAZY
 */
@Mapper(componentModel = "cdi", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface PropostaComercialMapper {

    // Ignorar relacionamentos ao converter para DTO (eles são carregados manualmente)
    @Mapping(target = "itens", ignore = true)
    PropostaComercialDto toDto(PropostaComercial entity);

    /**
     * DTO resumido para GET /propostas-comerciais — evita TEXT grandes e campos não usados na tabela.
     */
    default PropostaComercialDto toListDto(PropostaComercial entity) {
        if (entity == null) {
            return null;
        }
        PropostaComercialDto dto = new PropostaComercialDto();
        dto.id = entity.id;
        dto.numeroProposta = entity.numeroProposta;
        dto.produtoNome = entity.produtoNome;
        dto.produtoPn = entity.produtoPn;
        dto.produtoSn = entity.produtoSn;
        dto.produtoValor = entity.produtoValor;
        dto.clienteNome = entity.clienteNome;
        dto.clienteEmail = entity.clienteEmail;
        dto.dataProposta = entity.dataProposta;
        dto.status = entity.status;
        dto.moedaProposta = entity.moedaProposta;
        dto.totalGeralBrl = entity.totalGeralBrl;
        dto.totalGeralEur = entity.totalGeralEur;
        dto.totalGeralUsd = entity.totalGeralUsd;
        dto.valorTotalFinal = entity.valorTotalFinal;
        dto.osId = entity.osId;
        dto.osGeradaEm = entity.osGeradaEm;
        dto.osGeradaPor = entity.osGeradaPor;
        dto.createdAt = entity.createdAt;
        dto.itens = null;
        dto.aditivos = null;
        dto.anexos = null;
        repairForDisplay(dto);
        return dto;
    }

    @AfterMapping
    default void repairForDisplay(@MappingTarget PropostaComercialDto dto) {
        dto.numeroProposta = DisplayTextRepair.repair(dto.numeroProposta);
        dto.produtoNome = DisplayTextRepair.repair(dto.produtoNome);
        dto.produtoPn = DisplayTextRepair.repair(dto.produtoPn);
        dto.produtoSn = DisplayTextRepair.repair(dto.produtoSn);
        dto.produtoManual = DisplayTextRepair.repair(dto.produtoManual);
        dto.aplicacaoMotor = DisplayTextRepair.repair(dto.aplicacaoMotor);
        dto.aeronavePrefixo = DisplayTextRepair.repair(dto.aeronavePrefixo);
        dto.servicoExecutado = DisplayTextRepair.repair(dto.servicoExecutado);
        dto.tipoServicoNome = DisplayTextRepair.repair(dto.tipoServicoNome);
        dto.clienteNome = DisplayTextRepair.repair(dto.clienteNome);
        dto.clienteObservacao = DisplayTextRepair.repair(dto.clienteObservacao);
        dto.observacoes = DisplayTextRepair.repair(dto.observacoes);
        dto.condicoesGerais = DisplayTextRepair.repair(dto.condicoesGerais);
    }

    // Ignorar relacionamentos ao converter para Entity (eles são salvos manualmente)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "itens", ignore = true) // CRÍTICO: Ignorar itens - são salvos manualmente
    @Mapping(target = "envios", ignore = true) // Ignorar histórico de envios também
    @Mapping(target = "tenantId", ignore = true)
    PropostaComercial toEntity(PropostaComercialDto dto);

    // Ignorar relacionamentos ao atualizar Entity (eles são atualizados manualmente)
    // IMPORTANTE: Usar NullValuePropertyMappingStrategy.IGNORE para ignorar apenas null,
    // mas strings vazias serão atualizadas. Campos do cliente são atualizados explicitamente no Service.
    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "itens", ignore = true) // CRÍTICO: Ignorar itens - são atualizados manualmente
    @Mapping(target = "envios", ignore = true) // Ignorar histórico de envios também
    @Mapping(target = "tenantId", ignore = true)
    // Campos do cliente serão atualizados explicitamente no Service para garantir que sejam salvos
    void updateEntityFromDto(PropostaComercialDto dto, @MappingTarget PropostaComercial entity);
}
