package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

/**
 * DTO para lotes de produtos
 */
public class LoteDto {
    public Long id;
    public String codigoLote;
    
    public Long invoiceId;
    public String invoiceNumero;
    
    public Long fornecedorId;
    public String fornecedorNome;
    public String fornecedorCodigo;
    
    public LocalDate dataEntrada;
    public LocalDate dataValidade;
    
    public Integer quantidadeTotal;
    public Integer quantidadeDisponivel;
    
    public String localizacao;
    public String status;
    public String observacoes;
    
    public Boolean isActive;
    public LocalDateTime createdAt;
    public Long createdBy;
}
