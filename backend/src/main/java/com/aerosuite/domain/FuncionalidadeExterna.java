package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

/**
 * Entidade que representa funcionalidades disponíveis para usuários externos.
 */
@Entity
@Table(name = "funcionalidade_externa")
public class FuncionalidadeExterna extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @Column(name = "nome", nullable = false)
    public String nome;
    
    @Column(name = "descricao")
    public String descricao;
    
    @Column(name = "codigo", nullable = false, unique = true)
    public String codigo;
    
    @Column(name = "icone")
    public String icone;
    
    @Column(name = "rota")
    public String rota;
    
    @Column(name = "ordem")
    public Integer ordem = 0;
    
    @Column(name = "ativo")
    public Boolean ativo = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
    
    // Métodos de busca estáticos
    public static List<FuncionalidadeExterna> findAllAtivas() {
        return list("ativo = ?1 order by ordem", true);
    }
    
    public static FuncionalidadeExterna findByCodigo(String codigo) {
        return find("codigo = ?1", codigo).firstResult();
    }
}
