package com.aerosuite.mapping;

import com.aerosuite.domain.Usuario;
import com.aerosuite.dto.UserDto;
import jakarta.enterprise.context.ApplicationScoped;
import java.time.LocalDate;

@ApplicationScoped
public class UserMapper {
    
    public UserDto toDto(Usuario usuario) {
        if (usuario == null) {
            return null;
        }
        
        UserDto dto = new UserDto();
        dto.id = usuario.id;
        dto.tenantId = usuario.orgTenantId;
        dto.email = usuario.email;
        dto.nome = usuario.nome;
        dto.role = "user"; // Role padrão, pode ser expandido futuramente
        dto.dataCadastro = usuario.dataCadastro;
        dto.ultimoAcesso = usuario.ultimoAcesso;
        dto.fotoPerfil = usuario.fotoPerfil;
        dto.precisaTrocarSenha = usuario.precisaTrocarSenha != null ? usuario.precisaTrocarSenha : false;
        
        // Mapear perfil se existir
        if (usuario.perfil != null) {
            UserDto.PerfilDto perfilDto = new UserDto.PerfilDto();
            perfilDto.id = usuario.perfil.getId().intValue();
            perfilDto.nome = usuario.perfil.getNome();
            perfilDto.descricao = usuario.perfil.getDescricao();
            perfilDto.codigo = usuario.perfil.getCodigo();
            dto.perfil = perfilDto;
        }
        
        return dto;
    }
    
    public Usuario toEntity(UserDto dto) {
        if (dto == null) {
            return null;
        }
        
        Usuario usuario = new Usuario();
        usuario.id = dto.id;
        usuario.email = dto.email;
        usuario.nome = dto.nome;
        usuario.dataCadastro = LocalDate.now();
        
        return usuario;
    }
}
