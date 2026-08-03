package com.aerosuite.mapping;

import com.aerosuite.domain.OSFile;
import com.aerosuite.dto.OSFileDto;
import org.mapstruct.AfterMapping;
import org.mapstruct.Mapper;
import org.mapstruct.MappingTarget;
import org.mapstruct.ReportingPolicy;

@Mapper(componentModel = "cdi", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public abstract class OSFileMapper {
    
    public abstract OSFileDto toDto(OSFile entity);
    
    public abstract OSFile toEntity(OSFileDto dto);
    
    public abstract void updateEntityFromDto(OSFileDto dto, @MappingTarget OSFile entity);
    
    @AfterMapping
    protected void setIsAvulso(OSFile entity, @MappingTarget OSFileDto dto) {
        // Documento avulso é identificado pelo caminho contendo "/diversos/"
        if (entity != null && entity.filePath != null) {
            dto.isAvulso = entity.filePath.contains("/diversos/") || entity.filePath.contains("\\diversos\\");
        } else {
            dto.isAvulso = false;
        }
    }
}
