package com.aerosuite.dto;

/** Métricas extras do painel de OS (flag mro.os.dashboardExtendido). */
public record OsPainelResumoDto(
        long totalAtivas,
        long aguardando,
        long emExecucao,
        long aguardandoPecas,
        long inspecao,
        long prioridadeAog,
        long crsPendente) {}
