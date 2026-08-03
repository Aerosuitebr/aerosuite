package com.aerosuite.dto;

public class PlatformOpsSessionResponse {
    public String token;
    public long expiresAtEpochMs;
    public String email;
    public String nome;
    /** Epoch ms da última confirmação MFA nesta sessão elevada. */
    public long mfaValidatedAtEpochMs;
    /** Intervalo configurado para pedir novo código MFA (minutos). */
    public int mfaRevalidateMinutes;
}
