package com.aerosuite.dto;

import java.time.LocalDateTime;

public record TicketCommentDto(
    Long id,
    Long ticketId,
    String conteudo,
    String tipo,
    Boolean visivelUsuario,
    Long usuarioId,
    String usuarioNome,
    String usuarioTipo,
    String statusAnterior,
    String statusNovo,
    LocalDateTime dataCriacao,
    LocalDateTime dataEdicao,
    Boolean isActive
) {}
