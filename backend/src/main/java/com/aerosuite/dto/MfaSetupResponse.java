package com.aerosuite.dto;

public class MfaSetupResponse {
    /** Segredo Base32 (exibir uma vez; compatível com apps autenticadoras). */
    public String secret;
    /** URI otpauth:// para QR code. */
    public String otpAuthUri;
    public boolean enabled;

    public MfaSetupResponse() {}

    public MfaSetupResponse(String secret, String otpAuthUri, boolean enabled) {
        this.secret = secret;
        this.otpAuthUri = otpAuthUri;
        this.enabled = enabled;
    }
}
