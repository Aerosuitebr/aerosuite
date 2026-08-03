package com.aerosuite.service;

/** Disparado quando uma OS passa a ter data de conclusão ou fechamento preenchida. */
public record OsServicoConcluidoEvent(long tenantId, long osId) {}
