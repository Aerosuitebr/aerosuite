package com.aerosuite.dto;

import java.math.BigDecimal;

public class ConformidadeTreinamentoDto {
    public Long id;
    public Integer usuarioId;
    public String usuarioNome;
    public String curso;
    public BigDecimal cargaHoraria;
    public String dataConclusao;
    public String dataValidade;
    public String certificador;
    public String observacoes;
    public String turmaRef;
    public Boolean presenteLista;
    public boolean ativo;
    public String severidadeAlerta;
    public Integer diasParaValidade;
}
