package com.aerosuite.dto;

public class RelatorioChartSliceDto {
    public String label;
    public long value;

    public RelatorioChartSliceDto() {}

    public RelatorioChartSliceDto(String label, long value) {
        this.label = label;
        this.value = value;
    }
}
