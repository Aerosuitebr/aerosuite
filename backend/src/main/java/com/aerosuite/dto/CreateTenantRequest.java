package com.aerosuite.dto;

/**
 * Provisão de nova organização (tenant SaaS).
 */
public class CreateTenantRequest {
    /** Código único (slug), ex.: {@code acme}. */
    public String codigo;
    public String nome;
    /** Opcional: e-mail do administrador inicial. */
    public String adminEmail;
    public String adminNome;
    /** Opcional: senha inicial; se vazio, gera-se senha temporária. */
    public String adminSenha;
    /** Opcional: nome comercial na configuração da empresa. */
    public String displayName;
    public String supportEmail;
    /** Envia e-mail de boas-vindas ao administrador inicial (se criado). */
    public Boolean sendWelcomeEmail = true;
    /** Módulos: MRO, ESTOQUE, COMERCIAL (opcional; default todos). */
    public java.util.List<String> modulosHabilitados;
}
