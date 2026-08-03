package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class PacoteAuditoriaTenantResumoDto {
    public int totalOsIncluidas;
    public int limiteMaximo;
    public String dataInicio;
    public String dataFim;
    public List<OsPacoteLinhaDto> ordens = new ArrayList<>();

    public static class OsPacoteLinhaDto {
        public Long osId;
        public Integer numeroOs;
        public String clienteNome;
        public String dtAbertura;
        public String dataFechamento;
        public String partNumber;
        public String serialNumber;
        public Boolean crsEmitido;
        public int totalAnexos;
    }
}
