package com.aerosuite.mapping;

import com.aerosuite.domain.PublicacaoTecnica;
import com.aerosuite.dto.PublicacaoTecnicaDto;
import jakarta.enterprise.context.ApplicationScoped;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

@ApplicationScoped
@Mapper(componentModel = "jakarta", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface PublicacaoTecnicaMapper {
    
    @Mapping(target = "fabricanteNome", source = "fabricante.nome")
    PublicacaoTecnicaDto toDto(PublicacaoTecnica entity);
    
    PublicacaoTecnica toEntity(PublicacaoTecnicaDto dto);
}
