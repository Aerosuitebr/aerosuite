package com.aerosuite.mapping;

import com.aerosuite.domain.TicketComment;
import com.aerosuite.dto.TicketCommentDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi")
public interface TicketCommentMapper {
    
    @Mapping(target = "ticketId", source = "ticket.id")
    TicketCommentDto toDto(TicketComment entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ticket", ignore = true)
    @Mapping(target = "dataCriacao", ignore = true)
    @Mapping(target = "dataEdicao", ignore = true)
    TicketComment toEntity(TicketCommentDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ticket", ignore = true)
    void updateEntity(TicketCommentDto dto, @MappingTarget TicketComment entity);
}
