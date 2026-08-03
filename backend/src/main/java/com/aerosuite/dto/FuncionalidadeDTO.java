package com.aerosuite.dto;

import com.aerosuite.model.TipoFuncionalidade;
import java.time.LocalDateTime;
import java.util.Set;

public class FuncionalidadeDTO {
    private Long id;
    private String nome;
    private String descricao;
    private String codigo;
    private String icone;
    private String rota;
    private Integer ordem;
    private String secao;
    private Long parentId;
    private TipoFuncionalidade tipo;
    private Boolean visivel;
    private String corIcone;
    private Integer posicao;
    private Boolean ativo;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private Set<Long> perfilIds;
    
    // Construtores
    public FuncionalidadeDTO() {}
    
    public FuncionalidadeDTO(Long id, String nome, String descricao, String codigo, String icone, String rota, Integer ordem, Boolean ativo) {
        this.id = id;
        this.nome = nome;
        this.descricao = descricao;
        this.codigo = codigo;
        this.icone = icone;
        this.rota = rota;
        this.ordem = ordem;
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
    
    public String getIcone() {
        return icone;
    }
    
    public void setIcone(String icone) {
        this.icone = icone;
    }
    
    public String getRota() {
        return rota;
    }
    
    public void setRota(String rota) {
        this.rota = rota;
    }
    
    public Integer getOrdem() {
        return ordem;
    }
    
    public void setOrdem(Integer ordem) {
        this.ordem = ordem;
    }
    
    public Boolean getAtivo() {
        return ativo;
    }
    
    public void setAtivo(Boolean ativo) {
        this.ativo = ativo;
    }
    
    public String getSecao() {
        return secao;
    }
    
    public void setSecao(String secao) {
        this.secao = secao;
    }
    
    public Long getParentId() {
        return parentId;
    }
    
    public void setParentId(Long parentId) {
        this.parentId = parentId;
    }
    
    public TipoFuncionalidade getTipo() {
        return tipo;
    }
    
    public void setTipo(TipoFuncionalidade tipo) {
        this.tipo = tipo;
    }
    
    public Boolean getVisivel() {
        return visivel;
    }
    
    public void setVisivel(Boolean visivel) {
        this.visivel = visivel;
    }
    
    public String getCorIcone() {
        return corIcone;
    }
    
    public void setCorIcone(String corIcone) {
        this.corIcone = corIcone;
    }
    
    public Integer getPosicao() {
        return posicao;
    }
    
    public void setPosicao(Integer posicao) {
        this.posicao = posicao;
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
    
    public Set<Long> getPerfilIds() {
        return perfilIds;
    }
    
    public void setPerfilIds(Set<Long> perfilIds) {
        this.perfilIds = perfilIds;
    }
}
