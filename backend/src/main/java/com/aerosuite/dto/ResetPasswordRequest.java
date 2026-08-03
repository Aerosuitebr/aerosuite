package com.aerosuite.dto;

public class ResetPasswordRequest {
    public String token;
    public String newPassword;
    
    public ResetPasswordRequest() {}
    
    public ResetPasswordRequest(String token, String newPassword) {
        this.token = token;
        this.newPassword = newPassword;
    }
}

