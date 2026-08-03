package com.aerosuite.dto;

public class ConformidadeSmsTendenciaMesDto {
    public String mes;
    public int abertas;
    public int fechadas;

    public ConformidadeSmsTendenciaMesDto() {}

    public ConformidadeSmsTendenciaMesDto(String mes, int abertas, int fechadas) {
        this.mes = mes;
        this.abertas = abertas;
        this.fechadas = fechadas;
    }
}
