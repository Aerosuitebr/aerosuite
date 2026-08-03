package com.aerosuite.dto;

/** Regras de saída de estoque ativas para o tenant. */
public class EstoqueSaidaRegrasDto {
    public boolean validacaoExtra;
    public int motivoMinLength;
    public boolean osObrigatoria;
    public boolean exigeCertificadoPeca;

    public EstoqueSaidaRegrasDto() {}

    public EstoqueSaidaRegrasDto(
            boolean validacaoExtra,
            int motivoMinLength,
            boolean osObrigatoria,
            boolean exigeCertificadoPeca) {
        this.validacaoExtra = validacaoExtra;
        this.motivoMinLength = motivoMinLength;
        this.osObrigatoria = osObrigatoria;
        this.exigeCertificadoPeca = exigeCertificadoPeca;
    }
}
