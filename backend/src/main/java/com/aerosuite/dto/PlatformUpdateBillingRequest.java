package com.aerosuite.dto;

public class PlatformUpdateBillingRequest {
    public String planoCodigo;
    public String status;
    /** Dias extras de trial (soma ao fim atual ou a partir de agora). */
    public Integer trialExtensionDays;
}
