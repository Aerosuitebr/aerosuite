package com.aerosuite.dto;

/** Opção de tenant no ecrã de login (mesmo e-mail em várias organizações). */
public class TenantLoginOptionDto {
    public Long id;
    public String codigo;
    public String nome;
    /** Rótulo para dropdown quando há organizações com o mesmo nome. */
    public String label;
    public String criadoEm;

    public TenantLoginOptionDto() {}

    public TenantLoginOptionDto(Long id, String codigo, String nome, String label, String criadoEm) {
        this.id = id;
        this.codigo = codigo;
        this.nome = nome;
        this.label = label;
        this.criadoEm = criadoEm;
    }
}
