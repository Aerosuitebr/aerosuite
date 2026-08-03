package com.aerosuite.dto;

import java.util.List;

/** Resultado da atualização em lote de estoque mínimo/ideal. */
public class EstoqueMinimoLoteResultDto {
    /** Part numbers que tiveram itens atualizados. */
    public List<String> partNumbersAtualizados;
    /** Part numbers da planilha que não existem no estoque. */
    public List<String> partNumbersNaoEncontrados;
    /** Total de itens (registros) atualizados. */
    public long totalItensAtualizados;
    /** Total de linhas processadas da planilha. */
    public int linhasProcessadas;
}
