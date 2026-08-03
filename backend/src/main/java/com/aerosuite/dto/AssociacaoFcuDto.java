package com.aerosuite.dto;

import java.math.BigDecimal;

public class AssociacaoFcuDto {
    public Integer id;
    public Long idFcu;
    public Integer idProduct;
    public Integer qtdProduct;
    
    // Campos do FCU para exibição
    public String fcuCodigo;
    public String fcuDescription;
    public String fcuModelo;
    public String fcuPn;
    public String fcuSerialNumber;
    
    // Campos do Product para exibição
    public String productName;
    public String productDescription;
    public String productPn;
    public BigDecimal productPrice;
    public Integer productQuantity;
    public String productStatus;
    public String productLocal;
    public Boolean productIsActive; // Indica se o produto está ativo
    
    // Campo isActive da associação
    public Boolean isActive;
}
