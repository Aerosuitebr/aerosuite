package com.aerosuite.dto;

import java.time.LocalDateTime;

public record NrcAuditoriaDto(
    Long id,
    Long nrcId,
    String acao,
    String campo,
    String valorAnterior,
    String valorNovo,
    Long usuarioId,
    String usuarioNome,
    LocalDateTime dataHora
) {}
