package com.aerosuite.dto;

import java.time.LocalDateTime;

public class PlatformOnboardingRequirementDto {
    public String requirementKey;
    public boolean fulfilled;
    public LocalDateTime fulfilledAt;
    public String operatorNotes;
}
