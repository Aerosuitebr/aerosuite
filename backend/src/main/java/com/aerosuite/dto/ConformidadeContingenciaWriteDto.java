package com.aerosuite.dto;

import java.util.List;

public class ConformidadeContingenciaWriteDto {
    public String titulo;
    public Long osId;
    public String periodoInicio;
    public String periodoFim;
    public List<ConformidadeChecklistItemDto> checklist;
    public String status;
    public String observacoes;
}
