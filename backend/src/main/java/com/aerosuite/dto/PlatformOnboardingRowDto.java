package com.aerosuite.dto;

import java.time.LocalDateTime;

public class PlatformOnboardingRowDto {
    public long tenantId;
    public String tenantCodigo;
    public String tenantNome;
    public boolean tenantAtivo;
    public String status;
    public String primaryContactName;
    public String primaryContactEmail;
    public int requirementsTotal;
    public int requirementsFulfilled;
    public LocalDateTime lastMessageAt;
    public LocalDateTime updatedAt;
}
