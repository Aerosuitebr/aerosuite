package com.aerosuite.dto;

import java.util.List;

public class ConformidadeReleaseAceiteWriteDto {
    public String versaoApp;
    public String flywayAte;
    public String tipoMudanca;
    public Boolean impactoRegulatorio;
    public List<ConformidadeChecklistItemDto> checklist;
    public String observacoes;
}
