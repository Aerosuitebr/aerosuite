package com.aerosuite.dto;

import java.time.LocalDateTime;
import java.util.Set;

public class PerfilDTO {
    private Long id;
    private String nome;
    private String descricao;
    private String codigo;
    private Boolean ativo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<Long> funcionalidadeIds;
    
    // Construtores
    public PerfilDTO() {}
    
    public PerfilDTO(Long id, String nome, String descricao, String codigo, Boolean ativo) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.codigo = codigo;
        this.ativo = ativo;
    }
    
    // Getters e Setters
    public Long getId() {
        return id;
    }
    
    public void setId(Long id) {
        this.id = id;
    }
    
    public String getNome() {
        return nome;
    }
    
    public void setNome(String nome) {
        this.nome = nome;
    }
    
    public String getDescricao() {
        return descricao;
    }
    
    public void setDescricao(String descricao) {
        this.descricao = descricao;
    }
    
    public String getCodigo() {
        return codigo;
    }
    
    public void setCodigo(String codigo) {
        this.codigo = codigo;
    }
    
    public Boolean getAtivo() {
        return ativo;
    }
    
    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
    
    public LocalDateTime getCreatedAt() {
        return createdAt;
    }
    
    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
    
    public LocalDateTime getUpdatedAt() {
        return updatedAt;
    }
    
    public void setUpdatedAt(LocalDateTime updatedAt) {
        this.updatedAt = updatedAt;
    }
    
    public Set<Long> getFuncionalidadeIds() {
        return funcionalidadeIds;
    }
    
    public void setFuncionalidadeIds(Set<Long> funcionalidadeIds) {
        this.funcionalidadeIds = funcionalidadeIds;
    }
}
