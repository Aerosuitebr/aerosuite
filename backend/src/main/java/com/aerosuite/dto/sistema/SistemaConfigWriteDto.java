package com.aerosuite.dto.sistema;

import java.util.Map;

public class SistemaConfigWriteDto {
    public Map<String, Object> valores;
    public Map<String, Object> avancadas;
    /** Se true, restaura valores padrão e remove personalização do tenant. */
    public Boolean restaurarPadroes;
}
