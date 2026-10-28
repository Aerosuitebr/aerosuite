package com.aerosuite.dto;

import java.time.LocalDate;

public record NrcPropostaTratamentoRequest(
    LocalDate prazoTratamento,
    Long responsavelTratamentoId,
    String responsavelTratamentoNome
) {}
