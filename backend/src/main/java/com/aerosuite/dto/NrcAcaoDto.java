package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public record NrcAcaoDto(
    Long id,
    Long nrcId,
    String descricao,
    String oQue,
    String porQue,
    String onde,
    LocalDate quandoAcao,
    Long responsavelId,
    String responsavelNome,
    String como,
    String quantoCusto,
    LocalDate prazo,
    String status,
    LocalDateTime dataConclusao,
    String evidenciaConclusao,
    Long concluidoPorId,
    String concluidoPorNome,
    Integer ordemItem
) {}
