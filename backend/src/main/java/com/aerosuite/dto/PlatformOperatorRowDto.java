package com.aerosuite.dto;

import java.time.LocalDateTime;

public class PlatformOperatorRowDto {
    public int usuarioId;
    public String nome;
    public String email;
    public String perfilCodigo;
    public String perfilNome;
    public boolean usuarioAtivo;
    public boolean opsAccessEffective;
    public boolean opsAccessFromConfig;
    public boolean opsAccessFromGrant;
    public boolean grantAtivo;
    public LocalDateTime grantedAt;
    public LocalDateTime revokedAt;

    public PlatformOperatorRowDto() {}
}
