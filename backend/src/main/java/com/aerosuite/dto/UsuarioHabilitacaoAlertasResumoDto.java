package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class UsuarioHabilitacaoAlertasResumoDto {
    public int diasJanela;
    public long totalVencidas;
    public long totalProximas;
    public long totalAtivas;
    public List<UsuarioHabilitacaoDto> itens = new ArrayList<>();
}
