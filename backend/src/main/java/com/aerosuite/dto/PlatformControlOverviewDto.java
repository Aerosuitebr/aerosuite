package com.aerosuite.dto;

import java.util.List;

public class PlatformControlOverviewDto {
    public long totalTenants;
    public long activeTenants;
    public long suspendedTenants;
    public TenantStatsDto platformStats;
    public PlatformAuditSummaryDto auditSummary;
    public PlatformBillingSummaryDto billingSummary;
    public List<AccessAuditEntryDto> recentAuditEvents;

    public PlatformControlOverviewDto() {}
}
