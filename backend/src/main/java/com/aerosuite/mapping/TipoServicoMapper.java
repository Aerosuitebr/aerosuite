package com.aerosuite.mapping;

import com.aerosuite.domain.TipoServico;
import com.aerosuite.dto.TipoServicoDto;
import com.aerosuite.util.DisplayTextRepair;
import org.mapstruct.*;

@Mapper(componentModel = "cdi")
public interface TipoServicoMapper {
    @Mapping(target = "nome", expression = "java(com.aerosuite.util.DisplayTextRepair.repair(e.nome))")
    TipoServicoDto toDto(TipoServico e);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(TipoServicoDto dto, @MappingTarget TipoServico entity);

    @BeanMapping(ignoreByDefault = true)
    TipoServico toEntity(TipoServicoDto dto);
}
