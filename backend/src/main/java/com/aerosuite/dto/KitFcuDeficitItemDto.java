package com.aerosuite.dto;

/**
 * Item de déficit do kit FCU (preview antes de salvar a OS ou detalhe da OS já salva).
 */
public class KitFcuDeficitItemDto {
    public Integer produtoCatalogoId;
    public String productPn;
    public String productName;
    /** Quantidade total necessária no kit do FCU (somando associações repetidas, se houver). */
    public int quantidadeNecessaria;
    /** Quantidade disponível em estoque (itens DISPONIVEL ativos). */
    public double quantidadeDisponivel;
    /** Quantidade que faltaria para cobrir o kit. {@code max(0, necessaria - disponivel)}. */
    public double deficit;

    public KitFcuDeficitItemDto() {}

    public KitFcuDeficitItemDto(Integer produtoCatalogoId, String productPn, String productName,
                                int quantidadeNecessaria, double quantidadeDisponivel, double deficit) {
        this.produtoCatalogoId = produtoCatalogoId;
        this.productPn = productPn;
        this.productName = productName;
        this.quantidadeNecessaria = quantidadeNecessaria;
        this.quantidadeDisponivel = quantidadeDisponivel;
        this.deficit = deficit;
    }
}
