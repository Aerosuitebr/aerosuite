package com.aerosuite.dto;

import java.time.LocalDateTime;

public record NrcAnexoDto(
    Long id,
    Long nrcId,
    String nomeArquivo,
    String nomeOriginal,
    String tipoArquivo,
    Long tamanhoBytes,
    String caminhoArquivo,
    String urlDownload,
    String descricao,
    String categoria,
    Long usuarioId,
    String usuarioNome,
    LocalDateTime dataUpload,
    Boolean isActive
) {}
