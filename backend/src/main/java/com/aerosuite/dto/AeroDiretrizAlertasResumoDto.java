package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class AeroDiretrizAlertasResumoDto {
    public int diasJanela;
    public long totalVencidas;
    public long totalProximas;
    public long totalAbertas;
    public List<AeroDiretrizDto> itens = new ArrayList<>();
}
