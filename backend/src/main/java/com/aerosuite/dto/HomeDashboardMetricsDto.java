package com.aerosuite.dto;

/** Contagens leves para o painel inicial (evita 4× list paginado no cliente). */
public record HomeDashboardMetricsDto(
        long products,
        long fabricantes,
        long ordensServico,
        long usuarios) {}
