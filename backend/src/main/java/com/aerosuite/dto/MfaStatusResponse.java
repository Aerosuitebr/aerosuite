package com.aerosuite.dto;

public class MfaStatusResponse {
    public boolean policyRequired;
    public boolean enabled;
    public boolean enrollmentPending;

    public MfaStatusResponse() {}

    public MfaStatusResponse(boolean policyRequired, boolean enabled, boolean enrollmentPending) {
        this.policyRequired = policyRequired;
        this.enabled = enabled;
        this.enrollmentPending = enrollmentPending;
    }
}
