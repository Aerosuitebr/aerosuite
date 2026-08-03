package com.aerosuite.dto;

public class TokenValidationResponse {
    public boolean valid;
    public String email;
    
    public TokenValidationResponse() {}
    
    public TokenValidationResponse(boolean valid, String email) {
        this.valid = valid;
        this.email = email;
    }
}

