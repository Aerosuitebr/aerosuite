package com.aerosuite.dto;

public class LoginRequest {
    public String email;
    public String password;
    /** Código da organização ({@code tenant.codigo}); obrigatório se o e-mail existir em mais de um tenant. */
    public String tenantCodigo;
    /** Código TOTP de 6 dígitos (segundo fator), quando exigido pela política MFA. */
    public String totpCode;

    public LoginRequest() {}

    public LoginRequest(String email, String password) {
        this.email = email;
        this.password = password;
    }

    public LoginRequest(String email, String password, String tenantCodigo) {
        this.email = email;
        this.password = password;
        this.tenantCodigo = tenantCodigo;
    }
}
