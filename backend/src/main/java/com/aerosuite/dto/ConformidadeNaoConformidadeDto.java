package com.aerosuite.dto;

import java.util.List;

public class ConformidadeNaoConformidadeDto {
    public Long id;
    public String numero;
    public String titulo;
    public String descricao;
    public String severidade;
    public String status;
    /** PK interna da OS vinculada ({@code os.id}). */
    public Integer osId;
    /** Número de negócio da OS ({@code os.id_os}) para exibição. */
    public Integer osNumero;
    public String osClienteNome;
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
    public List<ConformidadeNcCapaEtapaDto> etapas;
    public List<ConformidadeNcAnexoDto> anexos;
}
