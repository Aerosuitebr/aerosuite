package com.aerosuite.model;

import com.fasterxml.jackson.annotation.JsonCreator;
import com.fasterxml.jackson.annotation.JsonValue;

public enum TipoFuncionalidade {
    secao("Seção"),
    funcionalidade("Funcionalidade"),
    submenu("Submenu");
    
    private final String descricao;
    
    TipoFuncionalidade(String descricao) {
        this.descricao = descricao;
    }
    
    public String getDescricao() {
        return descricao;
    }
    
    @JsonValue
    public String getValue() {
        return this.name();
    }
    
    @JsonCreator
    public static TipoFuncionalidade fromString(String value) {
        if (value == null) {
            return funcionalidade;
        }
        
        // Aceitar tanto maiúsculas quanto minúsculas
        switch (value.toLowerCase()) {
            case "secao":
                return secao;
            case "funcionalidade":
                return funcionalidade;
            case "submenu":
                return submenu;
            default:
                return funcionalidade;
        }
    }
}
