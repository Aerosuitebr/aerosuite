package com.aerosuite.dto;

public class PlatformBillingSummaryDto {
    public long active;
    public long trialing;
    public long trialExpired;
    /** Canceladas, checkout pendente ou inadimplência (past_due). */
    public long overdue;
    public long canceled;
    public long checkoutPending;
    public long other;

    public PlatformBillingSummaryDto() {}
}
