package com.aerosuite.dto;

public class ForgotPasswordRequest {
    public String email;
    /** Código da organização quando o e-mail existe em mais de um tenant. */
    public String tenantCodigo;

    public ForgotPasswordRequest() {}

    public ForgotPasswordRequest(String email) {
        this.email = email;
    }

    public ForgotPasswordRequest(String email, String tenantCodigo) {
        this.email = email;
        this.tenantCodigo = tenantCodigo;
    }
}

