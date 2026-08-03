package com.aerosuite.dto;

/**
 * Resultado da comparação entre estoque disponível (itens DISPONÍVEIS) e quantidade solicitada.
 */
public class DisponibilidadePnResultDto {
    public String partNumber;
    public double quantidadeSolicitada;
    public double quantidadeDisponivel;
    public boolean semEstoque;

    public DisponibilidadePnResultDto() {}

    public DisponibilidadePnResultDto(String partNumber, double quantidadeSolicitada, double quantidadeDisponivel, boolean semEstoque) {
        this.partNumber = partNumber;
        this.quantidadeSolicitada = quantidadeSolicitada;
        this.quantidadeDisponivel = quantidadeDisponivel;
        this.semEstoque = semEstoque;
    }
}
