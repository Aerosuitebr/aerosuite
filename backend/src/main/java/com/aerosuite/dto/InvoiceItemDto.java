package com.aerosuite.dto;

import java.math.BigDecimal;

public class InvoiceItemDto {
    public Long id;
    public Long invoiceId;
    public Integer linha;
    public String partNumber;
    public String descricao;
    public BigDecimal quantidade;
    public String unidade;
    public BigDecimal valorUnitario;
    public BigDecimal valorTotal;
    public BigDecimal quantidadeRecebida;
    public BigDecimal quantidadePendente;
    public String status;
    public String observacoes;
}
