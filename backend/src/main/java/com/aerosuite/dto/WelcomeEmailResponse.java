package com.aerosuite.dto;

public class WelcomeEmailResponse {
    public boolean sent;
    public String recipientEmail;
    public String message;
    public String adminSenhaTemporaria;

    public WelcomeEmailResponse() {}

    public WelcomeEmailResponse(boolean sent, String recipientEmail, String message, String adminSenhaTemporaria) {
        this.sent = sent;
        this.recipientEmail = recipientEmail;
        this.message = message;
        this.adminSenhaTemporaria = adminSenhaTemporaria;
    }
}
