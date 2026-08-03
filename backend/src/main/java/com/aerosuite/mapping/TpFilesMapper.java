package com.aerosuite.mapping;

import com.aerosuite.domain.TpFiles;
import com.aerosuite.dto.TpFilesDto;
import org.mapstruct.Mapper;
import org.mapstruct.ReportingPolicy;
import org.mapstruct.factory.Mappers;

@Mapper(unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TpFilesMapper {
    
    TpFilesMapper INSTANCE = Mappers.getMapper(TpFilesMapper.class);
    
    TpFilesDto toDto(TpFiles entity);
    
    TpFiles toEntity(TpFilesDto dto);
}
