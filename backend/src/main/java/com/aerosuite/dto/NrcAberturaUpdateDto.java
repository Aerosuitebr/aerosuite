package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

/** Opening data only — no workflow, identity or delegation fields. */
public record NrcAberturaUpdateDto(
    String origem,
    String tipoNc,
    String severidade,
    String descricaoOcorrido,
    String requisitoNaoAtendido,
    String documentoEnvolvido,
    String requisitoReferencia,
    String evidenciasTexto,
    String localOcorrencia,
    LocalDateTime dataOcorrencia,
    Long osId,
    String osNumero,
    String partNumber,
    String serialNumber,
    Long invoiceId,
    String invoiceNumero,
    Long loteId,
    String loteCodigo,
    String clienteNome,
    Long fcuId,
    String fcuCodigo,
    LocalDate prazoTratamento,
    BigDecimal custoNaoConformidade
) {}
