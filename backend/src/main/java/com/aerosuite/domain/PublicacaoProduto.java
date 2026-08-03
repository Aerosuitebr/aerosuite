package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "publicacao_fcu")
public class PublicacaoProduto extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @Column(name = "publicacao_id")
    public Integer publicacaoId;
    
    @Column(name = "fcu_id")
    public Integer fcuId;
    
    @Column(name = "is_active")
    public Boolean isActive = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    public Integer createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "publicacao_id", insertable = false, updatable = false)
    public PublicacaoTecnica publicacao;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fcu_id", insertable = false, updatable = false)
    public Fcu fcu;
    
    @PrePersist
    public void prePersist() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        updatedAt = LocalDateTime.now();
    }
    
    @PreUpdate
    public void preUpdate() {
        updatedAt = LocalDateTime.now();
    }
}
