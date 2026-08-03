package com.aerosuite.mapping;

import com.aerosuite.domain.TipoServico;
import com.aerosuite.dto.TipoServicoDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi")
public interface TipoServicoMapper {
    TipoServicoDto toDto(TipoServico e);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(TipoServicoDto dto, @MappingTarget TipoServico entity);

    @BeanMapping(ignoreByDefault = true)
    TipoServico toEntity(TipoServicoDto dto);
}
