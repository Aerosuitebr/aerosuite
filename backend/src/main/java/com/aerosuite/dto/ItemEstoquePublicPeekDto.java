package com.aerosuite.dto;

import java.time.LocalDate;

/**
 * Dados públicos do item (consulta via QR na etiqueta, sem autenticação).
 */
public class ItemEstoquePublicPeekDto {
    public String codigoRastreio;
    public String partNumber;
    public String serialNumber;
    public String descricao;
    public String unidade;
    public String status;
    public String fornecedorNome;
    public String fornecedorPais;
    public String invoiceNumero;
    public String loteCodigo;
    public String localizacao;
    public String prateleira;
    public String gaveta;
    public String certificadoConformidade;
    public LocalDate dataFabricacao;
    public LocalDate dataValidade;
    public Integer shelfLifeMeses;
}
