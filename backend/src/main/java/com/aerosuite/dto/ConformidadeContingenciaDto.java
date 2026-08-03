package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

public class ConformidadeContingenciaDto {
    public Long id;
    public String titulo;
    public Long osId;
    public String periodoInicio;
    public String periodoFim;
    public List<ConformidadeChecklistItemDto> checklist = new ArrayList<>();
    public String status;
    public String observacoes;
    public String concluidoEm;
    public String createdAt;
}
