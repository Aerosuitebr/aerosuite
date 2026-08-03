package com.aerosuite.model;

import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "funcionalidade")
public class Funcionalidade {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;
    
    @Column(name = "nome", nullable = false, length = 100)
    private String nome;
    
    @Column(name = "descricao", length = 255)
    private String descricao;
    
    @Column(name = "codigo", nullable = false, unique = true, length = 50)
    private String codigo;
    
    @Column(name = "icone", length = 50)
    private String icone;
    
    @Column(name = "rota", length = 100)
    private String rota;
    
    @Column(name = "ordem")
    private Integer ordem;
    
    @Column(name = "secao", nullable = false, length = 50)
    private String secao;
    
    @Column(name = "parent_id")
    private Long parentId;
    
    @Enumerated(EnumType.STRING)
    @Column(name = "tipo", nullable = false)
    private TipoFuncionalidade tipo = TipoFuncionalidade.funcionalidade;
    
    @Column(name = "visivel", nullable = false)
    private Boolean visivel = true;
    
    @Column(name = "cor_icone", length = 7)
    private String corIcone;
    
    @Column(name = "posicao", nullable = false)
    private Integer posicao = 0;

    @Column(name = "ativo", nullable = false)
    private Boolean ativo = true;

    /** Se false, não aparece na matriz RBAC do tenant (reservado ao plano de controle). */
    @Column(name = "gestao_rbac", nullable = false)
    private Boolean gestaoRbac = true;


    @Column(name = "created_at")
    private LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
    
    // Relacionamento será gerenciado pelo Perfil
    // @ManyToMany(mappedBy = "funcionalidades")
    // private Set<Perfil> perfis;
    
    // Construtores
    public Funcionalidade() {}
    
    public Funcionalidade(String nome, String descricao, String codigo, String icone, String rota, Integer ordem) {
        this.nome = nome;
        this.descricao = descricao;
        this.codigo = codigo;
        this.icone = icone;
        this.rota = rota;
        this.ordem = ordem;
        this.ativo = true;
        this.createdAt = LocalDateTime.now();
        this.updatedAt = LocalDateTime.now();
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

    public Boolean getGestaoRbac() {
        return gestaoRbac;
    }

    public void setGestaoRbac(Boolean gestaoRbac) {
        this.gestaoRbac = gestaoRbac;
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
    
    // Métodos de relacionamento removidos para evitar dependência circular
    
    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
