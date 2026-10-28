package com.aerosuite.dto;

import java.util.List;

public record NrcDashboardDto(
    long abertas,
    long emTratamento,
    long vencidas,
    long proximasVencimento,
    long encerradasMes,
    long total,
    long etapaContencao,
    long etapaCausa,
    long etapaAcoes,
    long etapaEficacia,
    List<NrcDashboardTrendPoint> tendenciaMensal,
    List<NrcDashboardCountItem> porSeveridade,
    List<NrcDashboardCountItem> porOrigem,
    Double taxaEncerramentoMes,
    Double taxaEficacia,
    Double leadTimeMedioDias,
    Double custoConsolidado,
    List<String> locaisDisponiveis
) {}
