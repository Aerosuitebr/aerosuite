package com.aerosuite.dto;

public class ProvisionTenantResponse {
    public TenantDto tenant;
    public Integer adminUserId;
    public String adminEmail;
    public boolean adminCreated;
    /** Preenchido apenas quando a senha do admin foi gerada automaticamente (mostrar uma vez). */
    public String adminSenhaTemporaria;
    public boolean senhaGeradaAutomaticamente;
    public boolean welcomeEmailSent;

    public ProvisionTenantResponse() {}

    public ProvisionTenantResponse(
            TenantDto tenant,
            Integer adminUserId,
            String adminEmail,
            boolean adminCreated,
            String adminSenhaTemporaria,
            boolean senhaGeradaAutomaticamente,
            boolean welcomeEmailSent) {
        this.tenant = tenant;
        this.adminUserId = adminUserId;
        this.adminEmail = adminEmail;
        this.adminCreated = adminCreated;
        this.adminSenhaTemporaria = adminSenhaTemporaria;
        this.senhaGeradaAutomaticamente = senhaGeradaAutomaticamente;
        this.welcomeEmailSent = welcomeEmailSent;
    }
}
