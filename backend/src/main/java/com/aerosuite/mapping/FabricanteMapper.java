package com.aerosuite.mapping;

import com.aerosuite.domain.Fabricante;
import com.aerosuite.dto.FabricanteDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FabricanteMapper {
    FabricanteDto toDto(Fabricante e);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(FabricanteDto dto, @MappingTarget Fabricante entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    @Mapping(target = "nome", source = "nome")
    @Mapping(target = "isActive", source = "isActive", defaultValue = "true")
    Fabricante toEntity(FabricanteDto dto);
}
