package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

/** P5.3 — Indicadores SMS (Safety Management System) derivados de NC/CAPA. */
public class ConformidadeSmsIndicadoresDto {
    public int diasJanela = 60;
    public int ncAbertas;
    public int ncFechadasPeriodo;
    public int ncAbertasPeriodo;
    public int ncCriticasSemAcao;
    public int ncMediaDiasAbertas;
    public int scoreRisco;
    public int taxaFechamentoPercent;
    public Map<String, Integer> porSeveridade = new LinkedHashMap<>();
    public Map<String, Integer> porCapaFase = new LinkedHashMap<>();
    public List<ConformidadeSmsTendenciaMesDto> tendenciaMensal = new ArrayList<>();
}
