package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "os_files")
public class OSFile extends PanacheEntityBase {
    
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
    
    @Column(name = "os_id", nullable = false)
    public Long osId;
    
    @Column(name = "file_name", nullable = false, length = 255)
    public String fileName;
    
    @Column(name = "original_name", length = 255)
    public String originalName;
    
    @Column(name = "file_path", nullable = false, length = 500)
    public String filePath;
    
    @Column(name = "file_size")
    public Long fileSize;
    
    @Column(name = "content_type", length = 100)
    public String contentType;
    
    @Column(name = "file_extension", length = 10)
    public String fileExtension;
    
    @Column(name = "created_at")
    public LocalDateTime createdAt;
    
    @Column(name = "updated_at")
    public LocalDateTime updatedAt;
    
    @Column(name = "is_active")
    public Boolean isActive = true;
    
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

