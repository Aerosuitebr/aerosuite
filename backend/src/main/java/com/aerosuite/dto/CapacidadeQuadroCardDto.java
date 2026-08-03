package com.aerosuite.dto;

/** Cartão de OS no quadro de capacidade (P5.3). */
public class CapacidadeQuadroCardDto {
    public Long osId;
    public Integer numeroOs;
    public String clienteNome;
    public String partNumber;
    public String serialNumber;
    public String tipoServico;
    public String dtAbertura;
    public String prioridadeFila;
    public String filaEstagio;
    public String dataPrevistaConclusao;
    public String slaStatus;
    public int posicaoFila;
    public boolean temDeficitKitFcu;
    public Long hangarId;
    public String hangarNome;
}
