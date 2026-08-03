package com.aerosuite.mapping;

import com.aerosuite.domain.Fcu;
import com.aerosuite.dto.FcuDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface FcuMapper {
    FcuDto toDto(Fcu entity);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntity(FcuDto dto, @MappingTarget Fcu entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "tenantId", ignore = true)
    Fcu toEntity(FcuDto dto);
}
