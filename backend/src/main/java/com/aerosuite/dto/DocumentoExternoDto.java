package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO para documento disponibilizado ao usuário externo.
 */
public record DocumentoExternoDto(
    Integer id,
    String nomeArquivo,
    String descricao,
    Boolean podeDownload,
    LocalDate dataExpiracao,
    LocalDateTime dataConcessao,
    Integer visualizacoes,
    LocalDateTime ultimoAcesso,
    Long osFileId,
    Long tpFileId,
    String tipoArquivo,
    Long tamanhoArquivo,
    Boolean isAvulso // Indica se é um documento avulso (pasta diversos)
) {}
