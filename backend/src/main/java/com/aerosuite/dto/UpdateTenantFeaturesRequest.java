package com.aerosuite.dto;

import java.util.List;

public class UpdateTenantFeaturesRequest {
    /** Códigos do catálogo que devem ficar habilitados para o tenant. */
    public List<String> enabled;
}
