package com.aerosuite.dto;

/** Reenvio de e-mail de boas-vindas; se vazio, usa o primeiro admin ativo da organização. */
public class WelcomeEmailRequest {
    public String adminEmail;
    /** Se true, gera nova senha temporária e invalida a anterior (apenas reenvio explícito). */
    public boolean resetAdminPassword;
}
