package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "publicacao_tecnica")
public class PublicacaoTecnica extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Integer id;
    
    @Column(name = "fabricante_id")
    public Integer fabricanteId;
    
    @Column(name = "ata_manual", length = 20)
    public String ataManual;
    
    @Column(name = "data_revisao_manual")
    public LocalDate dataRevisaoManual;
    
    @Column(name = "numero_revisao", length = 20)
    public String numeroRevisao;
    
    @Column(name = "tipo_manual", length = 1000)
    public String tipoManual;
    
    @Column(name = "is_active")
    public Boolean isActive = true;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Column(name = "created_by")
    public Integer createdBy;
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "fabricante_id", insertable = false, updatable = false)
    public Fabricante fabricante;
    
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
