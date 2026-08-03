package com.aerosuite.dto;

import java.util.List;

public class TenantListResponse {
    public List<TenantSummaryDto> items;
    public TenantStatsDto platformStats;

    public TenantListResponse() {}

    public TenantListResponse(List<TenantSummaryDto> items, TenantStatsDto platformStats) {
        this.items = items;
        this.platformStats = platformStats;
    }
}
