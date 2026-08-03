package com.aerosuite.dto;

public class PlatformChartPointDto {
    public String label;
    public double value;

    public PlatformChartPointDto() {}

    public PlatformChartPointDto(String label, double value) {
        this.label = label;
        this.value = value;
    }
}
