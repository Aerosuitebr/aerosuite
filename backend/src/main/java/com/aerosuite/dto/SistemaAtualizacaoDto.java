package com.aerosuite.dto;

import java.time.LocalDateTime;

public record SistemaAtualizacaoDto(
    Integer id,
    String versaoDisponivel,
    String versaoAtual,
    String status,
    Integer aprovadoPor,
    LocalDateTime dataAprovacao,
    LocalDateTime dataInicio,
    LocalDateTime dataConclusao,
    Integer contadorRegressivo,
    String mensagem,
    LocalDateTime createdAt,
    LocalDateTime updatedAt
) {}

