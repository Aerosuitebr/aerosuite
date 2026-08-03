package com.aerosuite.dto;

/** Política de retenção de registros de manutenção do tenant. */
public class RetencaoRegistrosConfigDto {
    public int anosRetencao;
    /** OS fechadas antes desta data estão fora do prazo configurado. */
    public String dataLimiteRetencao;
    public int minAnos;
    public int maxAnos;
}
