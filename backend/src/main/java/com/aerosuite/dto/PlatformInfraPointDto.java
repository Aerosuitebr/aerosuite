package com.aerosuite.dto;

public class PlatformInfraPointDto {
    public String label;
    public long rpm;
    public double webhookSuccessRate;

    public PlatformInfraPointDto() {}

    public PlatformInfraPointDto(String label, long rpm, double webhookSuccessRate) {
        this.label = label;
        this.rpm = rpm;
        this.webhookSuccessRate = webhookSuccessRate;
    }
}
