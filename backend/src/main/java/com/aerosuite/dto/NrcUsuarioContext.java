package com.aerosuite.dto;

public record NrcUsuarioContext(
    Long usuarioId,
    String usuarioNome,
    String localeTag
) {
    public NrcUsuarioContext(Long usuarioId, String usuarioNome) {
        this(usuarioId, usuarioNome, null);
    }
}
