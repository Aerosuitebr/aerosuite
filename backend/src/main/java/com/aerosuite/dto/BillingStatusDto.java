package com.aerosuite.dto;

import java.time.LocalDateTime;

public class BillingStatusDto {
    public Long tenantId;
    public String planoCodigo;
    public String status;
    public LocalDateTime trialEndsAt;
    public String provedor;
    public boolean checkoutAvailable;
    /** True quando Stripe tem secret + price id (provider stripe). */
    public boolean stripeConfigured;
}
