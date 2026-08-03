package com.aerosuite.mapping;

import com.aerosuite.model.Perfil;
import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.UsuarioDto;
import org.mapstruct.*;

@Mapper(componentModel = "cdi", unmappedTargetPolicy = ReportingPolicy.IGNORE)
public interface UsuarioMapper {
    @Mapping(target = "perfilId", source = "perfil.id")
    @Mapping(target = "perfil", source = "perfil")
    UsuarioDto toDto(Usuario e);
    
    // Mapear Perfil para PerfilInfo
    default UsuarioDto.PerfilInfo mapPerfil(Perfil perfil) {
        if (perfil == null) {
            return null;
        }
        return new UsuarioDto.PerfilInfo(
            perfil.getId() != null ? perfil.getId().intValue() : null,
            perfil.getNome(),
            perfil.getCodigo()
        );
    }

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "orgTenantId", ignore = true)
    void updateEntity(UsuarioDto dto, @MappingTarget Usuario entity);

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "perfil", ignore = true)
    @Mapping(target = "ativo", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "orgTenantId", ignore = true)
    Usuario toEntity(UsuarioDto dto);
}
