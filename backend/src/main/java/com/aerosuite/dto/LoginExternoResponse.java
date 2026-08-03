package com.aerosuite.dto;

import java.util.List;

/**
 * Response para login de usuário externo.
 */
public class LoginExternoResponse {
    public String token;
    public UsuarioExternoDto user;
    public List<FuncionalidadeExternaDto> funcionalidades;
    public boolean isExternal = true;
    
    public LoginExternoResponse() {}
    
    public LoginExternoResponse(String token, UsuarioExternoDto user, List<FuncionalidadeExternaDto> funcionalidades) {
        this.token = token;
        this.user = user;
        this.funcionalidades = funcionalidades;
        this.isExternal = true;
    }
}
