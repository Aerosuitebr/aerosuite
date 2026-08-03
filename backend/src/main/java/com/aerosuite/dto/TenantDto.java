package com.aerosuite.dto;

public class TenantDto {
    public Long id;
    public String codigo;
    public String nome;
    public Boolean ativo;
    public java.util.List<String> modulosHabilitados;

    public TenantDto() {}

    public TenantDto(Long id, String codigo, String nome, Boolean ativo) {
        this.id = id;
        this.codigo = codigo;
        this.nome = nome;
        this.ativo = ativo;
    }
}
