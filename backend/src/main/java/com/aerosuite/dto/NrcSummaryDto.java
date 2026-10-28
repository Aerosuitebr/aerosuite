package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/** List/search projection — no workflow detail, actions or audit. */
public record NrcSummaryDto(
    Long id,
    String numero,
    String status,
    LocalDateTime dataDeteccao,
    String origem,
    String severidade,
    Long osId,
    String osNumero,
    String clienteNome,
    LocalDate prazoTratamento,
    Long responsavelTratamentoId,
    String responsavelTratamentoNome,
    Boolean vencida,
    String etapaAtual,
    Boolean prontaParaEficacia,
    LocalDateTime dataEncerramento,
    /** True when the current user should see the "Tratar" CTA in list views. */
    Boolean mostrarTratar,
    /** Stage awaiting or last Quality approval: CONTENCAO, CAUSA, ACOES, TRATAMENTO. */
    String aprovacaoEtapa,
    /** AGUARDANDO, APROVADO or REJEITADO. */
    String aprovacaoStatus,
    /** Quality reviewer who approved or rejected (null while awaiting). */
    String aprovacaoPorNome,
    LocalDateTime aprovacaoEm
) {}
