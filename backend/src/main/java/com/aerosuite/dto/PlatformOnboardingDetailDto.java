package com.aerosuite.dto;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

public class PlatformOnboardingDetailDto {
    public long tenantId;
    public String tenantCodigo;
    public String tenantNome;
    public boolean tenantAtivo;
    public String status;
    public String primaryContactName;
    public String primaryContactEmail;
    public String primaryContactPhone;
    public String notes;
    public String publicFormUrl;
    public LocalDateTime publicSubmittedAt;
    public String legalName;
    public String legalDocument;
    public String adminEmail;
    public String supportEmail;
    public String billingContactName;
    public String billingContactEmail;
    public LocalDateTime updatedAt;
    public List<PlatformOnboardingRequirementDto> requirements = new ArrayList<>();
    public List<PlatformOnboardingMessageDto> messages = new ArrayList<>();
}
