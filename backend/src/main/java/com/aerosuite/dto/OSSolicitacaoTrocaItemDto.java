package com.aerosuite.dto;

/**
 * Item de produto solicitado na Solicitação de Troca Eventual na OS.
 */
public class OSSolicitacaoTrocaItemDto {
    public Long id;
    public Long idProduto;
    public String produtoNome;
    public String produtoDescricao;
    public String produtoPn;
    public String produtoSn;
    public Integer quantidade;
    public Double valorUnitario;
    public Double valorTotal;
    /** null = pendente; true = pago; false = não pago */
    public Boolean pago;
    public Integer ordem;
}
