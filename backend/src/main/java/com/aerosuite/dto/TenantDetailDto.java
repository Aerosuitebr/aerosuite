package com.aerosuite.dto;

import java.time.LocalDateTime;

public class TenantDetailDto {
    public Long id;
    public String codigo;
    public String nome;
    public Boolean ativo;
    public LocalDateTime createdAt;
    public String displayName;
    public String supportEmail;
    public String copyrightEntity;
    public TenantStatsDto stats;
    public TenantStatsDto statsPlatformTotal;
    public java.util.List<String> modulosHabilitados;
    public java.util.List<TenantFeatureCatalogItemDto> tenantFeatures;

    public TenantDetailDto() {}
}
