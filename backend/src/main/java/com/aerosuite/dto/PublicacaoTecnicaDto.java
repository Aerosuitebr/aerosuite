package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PublicacaoTecnicaDto {
    public Integer id;
    public Integer fabricanteId;
    public String ataManual;
    public LocalDate dataRevisaoManual;
    public String numeroRevisao;
    public String tipoManual;
    public Boolean isActive;
    public LocalDateTime createdAt;
    public LocalDateTime updatedAt;
    public Integer createdBy;
    
    // Campos do Fabricante para exibição
    public String fabricanteNome;
}
