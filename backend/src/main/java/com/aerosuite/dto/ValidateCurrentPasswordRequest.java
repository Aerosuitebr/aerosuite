package com.aerosuite.dto;

public class ValidateCurrentPasswordRequest {
    public String email;
    public String currentPassword;
    
    public ValidateCurrentPasswordRequest() {}
    
    public ValidateCurrentPasswordRequest(String email, String currentPassword) {
        this.email = email;
        this.currentPassword = currentPassword;
    }
}

