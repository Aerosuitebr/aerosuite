package com.aerosuite.dto;

import java.time.LocalDate;

/** Optional filters for dashboard aggregation. */
public record NrcDashboardFilter(
    Integer meses,
    String origem,
    String localOcorrencia,
    Boolean origemInterna,
    LocalDate dataInicio,
    LocalDate dataFim
) {
    public NrcDashboardFilter(Integer meses, String origem, String localOcorrencia, Boolean origemInterna) {
        this(meses, origem, localOcorrencia, origemInterna, null, null);
    }

    public int mesesEfetivos() {
        if (meses == null || meses < 3) {
            return 6;
        }
        return Math.min(meses, 12);
    }
}
