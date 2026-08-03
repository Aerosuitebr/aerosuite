package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

public class InvoiceDto {
    public Long id;
    public String numeroInvoice;
    public Long fornecedorId;
    public String fornecedorNome;
    public String fornecedorCodigo;
    public LocalDate dataEmissao;
    public LocalDate dataRecebimento;
    public String paisOrigem;
    public String moeda;
    public BigDecimal valorTotal;
    public BigDecimal valorFrete;
    public BigDecimal valorSeguro;
    public BigDecimal valorImpostos;
    public BigDecimal taxaCambio;
    public String numeroDi;
    public String numeroConhecimento;
    public String modalTransporte;
    public String status;
    public Boolean isActive;
    public String observacoes;
    public String arquivoInvoice;
    public LocalDateTime createdAt;
    public List<InvoiceItemDto> itens;
}
