package com.aerosuite.dto;

import java.time.LocalDate;
import java.util.List;

public record NrcAcoesRequest(
    List<NrcAcaoDto> acoes,
    LocalDate prazoTratamento
) {
    public NrcAcoesRequest(List<NrcAcaoDto> acoes) {
        this(acoes, null);
    }
}
