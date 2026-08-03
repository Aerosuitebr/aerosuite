package com.aerosuite.dto;

import java.util.List;

/** Cadastro self-service (trial) de nova organização. */
public class TrialSignupRequest {
    public String codigo;
    public String nome;
    public String adminEmail;
    public String adminNome;
    public String adminSenha;
    public List<String> modulosHabilitados;
    public boolean aceitoTermos;
    public String versaoTermos;
    public String versaoPrivacidade;
}
