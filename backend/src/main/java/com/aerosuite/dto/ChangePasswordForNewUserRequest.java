package com.aerosuite.dto;

public class ChangePasswordForNewUserRequest {
    public String email;
    public String senhaTemporaria;
    public String novaSenha;
    
    public ChangePasswordForNewUserRequest() {}
    
    public ChangePasswordForNewUserRequest(String email, String senhaTemporaria, String novaSenha) {
        this.email = email;
        this.senhaTemporaria = senhaTemporaria;
        this.novaSenha = novaSenha;
    }
}

