package com.aerosuite.dto;

import java.time.LocalDateTime;

public class PlatformBillingRowDto {
    public Long tenantId;
    public String tenantCodigo;
    public String tenantNome;
    public Boolean tenantAtivo;
    public String planoCodigo;
    public String status;
    public String effectiveStatus;
    public LocalDateTime trialEndsAt;
    public String provedor;
    public LocalDateTime updatedAt;
    public TenantStatsDto stats;

    public PlatformBillingRowDto() {}
}
