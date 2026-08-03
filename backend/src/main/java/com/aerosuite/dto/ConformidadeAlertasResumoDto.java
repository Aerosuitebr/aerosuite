package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class ConformidadeAlertasResumoDto {
    public int diasJanela;
    public long totalVencidas;
    public long totalProximas;
    public long totalAtivos;
    public List<Object> itens = new ArrayList<>();
}
