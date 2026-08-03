package com.aerosuite.security;

import jakarta.enterprise.context.RequestScoped;

/**
 * Metadados de autenticação do pedido (ex.: token legado de utilizador externo no Bearer).
 */
@RequestScoped
public class AuthRequestAttributes {

    private boolean externalLegacyToken;
    private Integer externalUserId;
    private String externalEmail;
    private Long externalOrgTenantId;

    public void clear() {
        this.externalLegacyToken = false;
        this.externalUserId = null;
        this.externalEmail = null;
        this.externalOrgTenantId = null;
    }

    public void setExternalLegacyToken(boolean externalLegacyToken) {
        this.externalLegacyToken = externalLegacyToken;
    }

    public boolean isExternalLegacyToken() {
        return externalLegacyToken;
    }

    public void setExternalLegacyUser(Integer userId, String email, Long orgTenantId) {
        this.externalLegacyToken = true;
        this.externalUserId = userId;
        this.externalEmail = email;
        this.externalOrgTenantId = orgTenantId;
    }

    public Integer getExternalUserId() {
        return externalUserId;
    }

    public String getExternalEmail() {
        return externalEmail;
    }

    public Long getExternalOrgTenantId() {
        return externalOrgTenantId;
    }
}
