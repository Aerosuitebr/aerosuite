package com.aerosuite.dto;

import java.math.BigDecimal;

public class OsJobCardApontamentoRequest {
    public String trabalhoEm;
    public BigDecimal horas;
    public String descricao;
    /** Identificador opcional de ferramenta calibrada (P1 enforcement). */
    public String ferramentaIdentificador;
}
