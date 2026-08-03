package com.aerosuite.mapping;

import com.aerosuite.domain.Ticket;
import com.aerosuite.dto.TicketDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi", uses = {TicketAttachmentMapper.class, TicketCommentMapper.class},
        unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface TicketMapper {
    
    @Mapping(target = "anexos", source = "anexos")
    @Mapping(target = "comentarios", source = "comentarios")
    TicketDto toDto(Ticket entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "numero", ignore = true)
    @Mapping(target = "dataAbertura", ignore = true)
    @Mapping(target = "dataUltimaAtualizacao", ignore = true)
    @Mapping(target = "anexos", ignore = true)
    @Mapping(target = "comentarios", ignore = true)
    Ticket toEntity(TicketDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "numero", ignore = true)
    @Mapping(target = "dataAbertura", ignore = true)
    @Mapping(target = "anexos", ignore = true)
    @Mapping(target = "comentarios", ignore = true)
    void updateEntity(TicketDto dto, @MappingTarget Ticket entity);
}
