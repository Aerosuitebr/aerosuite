package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class ConformidadeReleaseAceiteDto {
    public Long id;
    public String versaoApp;
    public String flywayAte;
    public String tipoMudanca;
    public boolean impactoRegulatorio;
    public List<ConformidadeChecklistItemDto> checklist = new ArrayList<>();
    public String observacoes;
    public Integer aceiteUsuarioId;
    public String aceiteUsuarioNome;
    public String aceiteEm;
}
