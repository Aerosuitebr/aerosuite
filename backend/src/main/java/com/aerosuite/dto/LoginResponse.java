package com.aerosuite.dto;

public class LoginResponse {
    public String token;
    public UserDto user;
    /** Opcional (ex.: primeira troca de senha). */
    public String message;

    public LoginResponse() {}

    public LoginResponse(String token, UserDto user) {
        this.token = token;
        this.user = user;
    }
}
