package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record UsuarioDto(
        Integer id,
        Long tenantId,
        String email,
        String nome,
        String senha,
        LocalDate dataCadastro,
        LocalDateTime ultimoAcesso,
        String fotoPerfil,
        Integer perfilId,
        PerfilInfo perfil,
        String idioma
) {
    // Classe interna para informações do perfil
    public record PerfilInfo(
        Integer id,
        String nome,
        String codigo
    ) {}
}
