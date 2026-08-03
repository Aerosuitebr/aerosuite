package com.aerosuite.dto;

/** Regras de saída de estoque ativas para o tenant (customização contratada). */
public class SaidaRegrasCustomizadasDto {
    public boolean validacaoExtra;
    public int motivoMinLength;
    public boolean osObrigatoria;

    public SaidaRegrasCustomizadasDto() {}

    public SaidaRegrasCustomizadasDto(boolean validacaoExtra, int motivoMinLength, boolean osObrigatoria) {
        this.validacaoExtra = validacaoExtra;
        this.motivoMinLength = motivoMinLength;
        this.osObrigatoria = osObrigatoria;
    }
}
