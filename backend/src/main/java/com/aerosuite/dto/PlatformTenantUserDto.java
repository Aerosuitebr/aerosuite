package com.aerosuite.dto;

import java.time.LocalDate;
import java.time.LocalDateTime;

public class PlatformTenantUserDto {
    public Integer id;
    public String tipo;
    public String email;
    public String nome;
    public Boolean ativo;
    public String perfilNome;
    public String perfilCodigo;
    public LocalDate dataCadastro;
    public LocalDateTime ultimoAcesso;
    public Boolean mfaEnabled;

    public PlatformTenantUserDto() {}
}
