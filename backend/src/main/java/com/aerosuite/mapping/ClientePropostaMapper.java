package com.aerosuite.mapping;

import com.aerosuite.domain.ClienteProposta;
import com.aerosuite.dto.ClientePropostaDto;
import jakarta.enterprise.context.ApplicationScoped;
import org.mapstruct.Mapper;

@ApplicationScoped
@Mapper(componentModel = "jakarta", unmappedTargetPolicy = org.mapstruct.ReportingPolicy.IGNORE)
public interface ClientePropostaMapper {
    
    ClientePropostaDto toDto(ClienteProposta entity);
    
    ClienteProposta toEntity(ClientePropostaDto dto);
}
