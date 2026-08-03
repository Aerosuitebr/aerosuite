package com.aerosuite.dto;

/**
 * Uma peça do kit do FCU vinculada à OS (filho do agrupamento {@link OsKitRastreioResumoDto}).
 */
public class KitProdutoPorOsLinhaDto {

    public boolean informacaoLegada = true;
    public Boolean confirmadoEmEstoque;
    public String origemInformacao = "CADASTRO_KIT_FCU";

    public Integer produtoCatalogoId;
    /** P/N da peça no catálogo ({@code product.productpn}). */
    public String productPn;
    public String productName;
    public Integer quantidadeKit;
}
