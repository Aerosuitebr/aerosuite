package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class ConformidadePainelDto {
    public int diasJanela = 60;
    public int totalDocumentosVencidos;
    public int totalDocumentosProximos;
    public int totalTreinamentosVencidos;
    public int totalTreinamentosProximos;
    public int totalCalibracaoVencida;
    public int totalCalibracaoProxima;
    public int totalNcAbertas;
    public int totalAslPendente;
    public int totalAslVencido;
    public int totalSubcontratacaoAlerta;
    public List<ConformidadePainelItemDto> itens = new ArrayList<>();
}
