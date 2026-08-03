package com.aerosuite.dto;

import java.util.List;

public class ConformidadeNaoConformidadeWriteDto {
    public String titulo;
    public String descricao;
    public String severidade;
    public String status;
    public Integer osId;
    public String dataAbertura;
    public String dataFechamento;
    public String acaoCorretiva;
    public String causaRaiz;
    public String acaoContencao;
    public String verificacaoEficacia;
    public Boolean eficaciaConfirmada;
    public String dataVerificacao;
    public String capaFase;
    public String observacoes;
    public List<ConformidadeNcCapaEtapaWriteDto> etapas;
}
