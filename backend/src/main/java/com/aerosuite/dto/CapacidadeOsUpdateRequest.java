package com.aerosuite.dto;

public class CapacidadeOsUpdateRequest {
    public String prioridadeFila;
    public String filaEstagio;
    public String dataPrevistaConclusao;
    /** {@code null} = não alterar; {@code 0} ou negativo = desvincular hangar. */
    public Long hangarId;
}
