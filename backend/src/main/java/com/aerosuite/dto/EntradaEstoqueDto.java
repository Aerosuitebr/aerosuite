package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;

/**
 * DTO para entrada de mercadoria no estoque
 */
public class EntradaEstoqueDto {
    // Identificação
    public String partNumber;
    public String serialNumber;
    public String descricao;
    public String unidade;
    
    // Quantidade e Valor
    public BigDecimal quantidade;
    public BigDecimal estoqueMinimo;
    public BigDecimal estoqueIdeal;
    public BigDecimal valorUnitarioUsd;
    public BigDecimal valorUnitarioBrl;
    
    // Rastreabilidade
    public Long fornecedorId;
    public Long invoiceId;
    public Long invoiceItemId;  // Item específico da invoice
    public Long loteId;
    public Boolean criarLote;  // Se true, cria um novo lote automaticamente
    
    // Localização
    public String localizacao;
    public String prateleira;
    public String gaveta;
    
    // Certificações
    public String certificadoConformidade;
    public String certTipo;
    public String certNumero;
    public String certEmissor;
    public LocalDate certDataEmissao;
    public String certOrgaoAprovacao;
    public LocalDate dataFabricacao;
    public LocalDate dataValidade;
    public Integer shelfLifeMeses;
    
    // Observações
    public String observacoes;
}
