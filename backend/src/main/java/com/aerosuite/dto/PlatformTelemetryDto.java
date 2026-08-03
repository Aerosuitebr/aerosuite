package com.aerosuite.dto;

import java.util.List;

public class PlatformTelemetryDto {
    public double mrr;
    public String mrrCurrency = "BRL";
    public long activeTenants;
    public double cpuUsagePercent;
    public double memoryUsagePercent;
    public long storageBytes;
    public List<PlatformChartPointDto> revenueSeries;
    public List<PlatformInfraPointDto> infraSeries;

    public PlatformTelemetryDto() {}
}
