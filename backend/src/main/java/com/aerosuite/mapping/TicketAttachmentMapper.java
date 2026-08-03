package com.aerosuite.mapping;

import com.aerosuite.domain.TicketAttachment;
import com.aerosuite.dto.TicketAttachmentDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi")
public interface TicketAttachmentMapper {
    
    @Mapping(target = "ticketId", source = "ticket.id")
    TicketAttachmentDto toDto(TicketAttachment entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ticket", ignore = true)
    @Mapping(target = "dataUpload", ignore = true)
    TicketAttachment toEntity(TicketAttachmentDto dto);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "ticket", ignore = true)
    void updateEntity(TicketAttachmentDto dto, @MappingTarget TicketAttachment entity);
}
