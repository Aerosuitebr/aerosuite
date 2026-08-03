package com.aerosuite.dto;

/**
 * Linha para consulta de disponibilidade de estoque por Part Number.
 */
public class ConsultaDisponibilidadeLinhaDto {
    public String partNumber;
    /** Quantidade solicitada (ex.: linha na OS); default 1 se null */
    public Double quantidade;
}
