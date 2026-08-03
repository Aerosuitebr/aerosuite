package com.aerosuite.dto;

/**
 * Pedido de importação CSV do kit go-live (P4.3).
 */
public class GoLiveImportRequestDto {
    /** Conteúdo CSV/TSV (cabeçalho na primeira linha). */
    public String csv;
    /** Se true, apenas valida e simula — não persiste. */
    public Boolean dryRun;
}
