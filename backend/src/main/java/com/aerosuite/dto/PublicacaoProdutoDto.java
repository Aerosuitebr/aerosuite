package com.aerosuite.dto;

import java.time.LocalDateTime;
import java.time.LocalDate;

public class PublicacaoProdutoDto {
    public Integer id;
    public Integer publicacaoId;
    public Integer fcuId;
    public Boolean isActive;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Integer createdBy;
    
    // Campos da Publicação para exibição
    public String publicacaoAtaManual;
    public String publicacaoNumeroRevisao;
    public String publicacaoTipoManual;
    public String fabricanteNome;
    
    // Campos do FCU (Produto Aeronáutico) para exibição
    public String fcuCodigo;
    public String fcuDescription;
    public String fcuModelo;
    public String fcuPn;
    public String fcuSerialNumber;
    public String fcuAtaManual;
    public LocalDate fcuDataRevManual;
    public String fcuNumRevisao;
    public Boolean fcuIsActive;
}
