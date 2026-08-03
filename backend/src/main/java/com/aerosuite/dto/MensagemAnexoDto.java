package com.aerosuite.dto;

import java.time.LocalDateTime;

public record MensagemAnexoDto(
    Long id,
    Long mensagemId,
    String nomeOriginal,
    String nomeArquivo,
    String tipoArquivo,
    Long tamanhoBytes,
    String caminho,
    String urlDownload,
    LocalDateTime dataUpload,
    Boolean ativo
) {}
