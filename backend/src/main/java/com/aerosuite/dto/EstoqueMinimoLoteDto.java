package com.aerosuite.dto;

import java.math.BigDecimal;

/**
 * Uma linha da planilha de importação de estoque mínimo/ideal em lote.
 * Identificação pelo Part Number; atualiza todos os itens com esse P/N.
 */
public class EstoqueMinimoLoteDto {
    /** Part Number do componente (obrigatório). */
    public String partNumber;
    /** Estoque mínimo desejado (opcional). */
    public BigDecimal estoqueMinimo;
    /** Estoque ideal desejado (opcional). */
    public BigDecimal estoqueIdeal;
}
