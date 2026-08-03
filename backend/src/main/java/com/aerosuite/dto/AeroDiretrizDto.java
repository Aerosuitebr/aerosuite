package com.aerosuite.dto;

public class AeroDiretrizDto {
    public Long id;
    public String tipo;
    public String numero;
    public String titulo;
    public String emissor;
    public String ata;
    public Integer fcuId;
    public String fcuCodigo;
    public String partNumber;
    public String serialNumber;
    public String dataEmissao;
    public String dataLimiteCumprimento;
    public String dataCumprimento;
    public String status;
    public Long osCumprimentoId;
    public Integer osNumero;
    public String observacoes;
    /** VENCIDA, PROXIMA, OK — apenas em listagens de alerta */
    public String severidadeAlerta;
    public Integer diasParaLimite;
}
