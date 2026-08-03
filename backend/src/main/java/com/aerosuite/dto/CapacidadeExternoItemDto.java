package com.aerosuite.dto;

/** Visão read-only da fila para o portal externo (P5.3). */
public class CapacidadeExternoItemDto {
    public Long osId;
    public Integer numeroOs;
    public String clienteNome;
    public String partNumber;
    public String serialNumber;
    public String filaEstagio;
    public String prioridadeFila;
    public int posicaoFila;
    public String dataPrevistaConclusao;
    public String slaStatus;
    public String status;
    public boolean temDeficitKitFcu;
}
