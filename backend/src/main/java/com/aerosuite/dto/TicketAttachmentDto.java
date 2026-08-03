package com.aerosuite.dto;

import java.time.LocalDateTime;

public record TicketAttachmentDto(
    Long id,
    Long ticketId,
    String nomeArquivo,
    String nomeOriginal,
    String tipoArquivo,
    Long tamanhoBytes,
    String caminhoArquivo,
    String urlDownload,
    String descricao,
    String tipoAnexo,
    Long usuarioId,
    String usuarioNome,
    LocalDateTime dataUpload,
    Boolean isActive
) {}
