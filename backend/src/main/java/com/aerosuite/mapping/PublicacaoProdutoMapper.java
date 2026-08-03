package com.aerosuite.mapping;

import com.aerosuite.domain.PublicacaoProduto;
import com.aerosuite.dto.PublicacaoProdutoDto;
import jakarta.enterprise.context.ApplicationScoped;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@ApplicationScoped
@Mapper(componentModel = "jakarta", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface PublicacaoProdutoMapper {
    
    @Mapping(target = "publicacaoAtaManual", source = "publicacao.ataManual")
    @Mapping(target = "publicacaoNumeroRevisao", source = "publicacao.numeroRevisao")
    @Mapping(target = "publicacaoTipoManual", source = "publicacao.tipoManual")
    @Mapping(target = "fabricanteNome", source = "publicacao.fabricante.nome")
    @Mapping(target = "fcuCodigo", source = "fcu.fcuCodigo")
    @Mapping(target = "fcuDescription", source = "fcu.fcuDescription")
    @Mapping(target = "fcuModelo", source = "fcu.modelo")
    @Mapping(target = "fcuPn", source = "fcu.pn")
    @Mapping(target = "fcuSerialNumber", source = "fcu.serialNumber")
    @Mapping(target = "fcuAtaManual", source = "fcu.ataManual")
    @Mapping(target = "fcuDataRevManual", source = "fcu.dataRevManual")
    @Mapping(target = "fcuNumRevisao", source = "fcu.numRevisao")
    @Mapping(target = "fcuIsActive", source = "fcu.isActive")
    PublicacaoProdutoDto toDto(PublicacaoProduto entity);
    
    PublicacaoProduto toEntity(PublicacaoProdutoDto dto);
}
