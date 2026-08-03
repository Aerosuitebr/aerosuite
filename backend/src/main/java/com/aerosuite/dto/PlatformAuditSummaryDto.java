package com.aerosuite.dto;

public class PlatformAuditSummaryDto {
    public long loginSuccess24h;
    public long loginFailure24h;
    public long rbacDenied24h;
    public long total24h;

    public PlatformAuditSummaryDto() {}

    public PlatformAuditSummaryDto(long loginSuccess24h, long loginFailure24h, long rbacDenied24h, long total24h) {
        this.loginSuccess24h = loginSuccess24h;
        this.loginFailure24h = loginFailure24h;
        this.rbacDenied24h = rbacDenied24h;
        this.total24h = total24h;
    }
}
