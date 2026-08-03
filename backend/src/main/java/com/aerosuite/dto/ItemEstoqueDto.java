package com.aerosuite.dto;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;

public class ItemEstoqueDto {
    public Long id;
    public String codigoRastreio;
    public String qrCodeData;
    
    // Identificação do Produto
    public String partNumber;
    public String serialNumber;
    public String descricao;
    public String unidade;
    
    // Quantidades e Valores
    public BigDecimal quantidade;
    public BigDecimal estoqueMinimo;
    public BigDecimal estoqueIdeal;
    public BigDecimal valorUnitarioUsd;
    public BigDecimal valorUnitarioBrl;
    
    // Rastreabilidade - IDs
    public Long fornecedorId;
    public Long invoiceId;
    public Long loteId;
    
    // Rastreabilidade - Informações
    public String fornecedorCodigo;
    public String fornecedorNome;
    public String fornecedorPais;
    public String invoiceNumero;
    public LocalDate invoiceData;
    public String loteCodigo;
    public LocalDate loteDataEntrada;
    
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
    public String certAnexoNome;
    public boolean certificadoTemAnexo;
    public boolean certificadoCompleto;
    public LocalDate dataFabricacao;
    public LocalDate dataValidade;
    public Integer shelfLifeMeses;
    
    // Quarentena
    public String quarentenaMotivo;
    public LocalDateTime quarentenaInicioEm;
    public String quarentenaInicioUsuarioNome;
    public LocalDateTime quarentenaFimEm;
    public String quarentenaFimUsuarioNome;
    public String quarentenaDisposicao;
    public String quarentenaObservacoes;

    // Status
    public String status;
    
    // Consumo
    public Long osId;
    public LocalDateTime dataConsumo;
    
    // Metadados
    public String observacoes;
    public LocalDateTime createdAt;
}
