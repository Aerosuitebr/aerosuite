package com.aerosuite.dto;

public class UpdateTenantRequest {
    public String nome;
    public Boolean ativo;
    public String displayName;
    public String supportEmail;
    public java.util.List<String> modulosHabilitados;
    /** Códigos de feature flags a habilitar (restante do catálogo fica desligado). */
    public java.util.List<String> featuresHabilitadas;
}
