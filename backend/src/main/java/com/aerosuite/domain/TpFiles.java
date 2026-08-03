package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tpfiles")
public class TpFiles extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "idTpFiles")
    public Long id;
    
    @Column(name = "name")
    public String name;
    
    @Column(name = "isActive", nullable = false)
    public Boolean isActive = true; // Valor padrão true para novos registros
    
    // Campos removidos para compatibilidade com o banco existente
    // @Column(name = "file_name", nullable = false)
    // public String fileName;
    
    // @Column(name = "original_name", nullable = false)
    // public String originalName;
    
    // @Column(name = "file_path", nullable = false)
    // public String filePath;
    
    // @Column(name = "file_size")
    // public Long fileSize;
    
    // @Column(name = "content_type")
    // public String contentType;
    
    // @Column(name = "file_extension")
    // public String fileExtension;
    
    // @Column(name = "description")
    // public String description;
    
    // @Column(name = "tipo_servico_id")
    // public Integer tipoServicoId;
    
    // @Column(name = "created_at")
    // public LocalDateTime createdAt;
    
    // @Column(name = "updated_at")
    // public LocalDateTime updatedAt;
    
    // @Column(name = "created_by")
    // public String createdBy;
    
    // @Column(name = "is_active")
    // public Boolean isActive = true;
    
    // @PrePersist
    // protected void onCreate() {
    //     createdAt = LocalDateTime.now();
    //     updatedAt = LocalDateTime.now();
    // }
    
    // @PreUpdate
    // protected void onUpdate() {
    //     updatedAt = LocalDateTime.now();
    // }
    
    // Relacionamento com TipoServico - removido para compatibilidade
    // @ManyToOne(fetch = FetchType.LAZY)
    // @JoinColumn(name = "tipo_servico_id", insertable = false, updatable = false)
    // public TipoServico tipoServico;
}
