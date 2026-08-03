package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class ConformidadeReleaseMetaDto {
    public String versaoApp;
    public String flywayAte;
    public List<ConformidadeChecklistItemDto> checklistPadrao = new ArrayList<>();
}
