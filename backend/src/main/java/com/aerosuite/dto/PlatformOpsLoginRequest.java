package com.aerosuite.dto;

public class PlatformOpsLoginRequest {
    public String email;
    public String password;
    /** Opcional quando MFA ativo no utilizador. */
    public String totpCode;
}
