package com.aerosuite.mapping;

import com.aerosuite.domain.TemplateProdutoServico;
import com.aerosuite.dto.TemplateProdutoServicoDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi")
public interface TemplateProdutoServicoMapper {

    TemplateProdutoServicoDto toDto(TemplateProdutoServico entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "vezesUtilizado", ignore = true)
    TemplateProdutoServico toEntity(TemplateProdutoServicoDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "vezesUtilizado", ignore = true)
    void updateEntityFromDto(TemplateProdutoServicoDto dto, @MappingTarget TemplateProdutoServico entity);
}
