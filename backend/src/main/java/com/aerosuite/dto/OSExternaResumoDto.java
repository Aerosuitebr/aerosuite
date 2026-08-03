package com.aerosuite.dto;

import java.time.LocalDate;

/**
 * DTO resumido para ordem de serviço visualizada por usuário externo.
 */
public record OSExternaResumoDto(
    Long id,
    Integer idOs,
    String clienteNome,
    String partNumber,
    String serialNumber,
    String tipoServico,
    LocalDate dtAbertura,
    LocalDate dataFechamento,
    String status,
    String fabricanteNome
) {}
