package com.aerosuite.dto;

public class OsJobCardListaItemDto {
    public Long osId;
    public Integer numeroOs;
    public String clienteNome;
    public String partNumber;
    public String serialNumber;
    public String marcasMatricula;
    public String dtAbertura;
    public String tipoServico;
    /** A_FAZER | EM_ANDAMENTO | AGUARDANDO_PECA | CONCLUIDO */
    public String faseJob;
    public Integer progressPct;
    public Integer assinaturasConcluidas;
    public Boolean crsEmitido;
}
