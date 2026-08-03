package com.aerosuite.dto;

public record ParticipanteResumoDto(
    Long usuarioId,
    String nome,
    String email,
    String fotoPerfil,
    String papel,
    Boolean online
) {}
