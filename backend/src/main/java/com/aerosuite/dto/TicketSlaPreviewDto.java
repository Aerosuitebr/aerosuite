package com.aerosuite.dto;

/** Pré-visualização de SLA conforme prioridade, ambiente e categoria. */
public record TicketSlaPreviewDto(
        Integer primeiraRespostaMinutos,
        Integer resolucaoMinutos,
        Integer primeiraRespostaHoras,
        Integer resolucaoHoras,
        String ambienteModifier) {}
