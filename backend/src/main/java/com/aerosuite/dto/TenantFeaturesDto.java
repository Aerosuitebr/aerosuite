package com.aerosuite.dto;

import java.util.ArrayList;
import java.util.List;

/** Flags habilitadas no tenant do utilizador autenticado. */
public class TenantFeaturesDto {
    public List<String> enabled = new ArrayList<>();

    public TenantFeaturesDto() {}

    public TenantFeaturesDto(List<String> enabled) {
        this.enabled = enabled != null ? enabled : new ArrayList<>();
    }
}
