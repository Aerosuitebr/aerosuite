package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(name = "studio_render_job")
public class StudioRenderJob extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "template_id", nullable = false, length = 64)
    public String templateId;

    @Column(name = "status", nullable = false, length = 32)
    public String status = "COMPLETED";

    @Column(name = "file_name", length = 255)
    public String fileName;

    @Column(name = "file_path", length = 512)
    public String filePath;

    @Column(name = "preview_path", length = 512)
    public String previewPath;

    @Column(name = "media_type", length = 64)
    public String mediaType;

    @Column(name = "error_message", length = 512)
    public String errorMessage;

    @Column(name = "parameters_json", columnDefinition = "TEXT")
    public String parametersJson;

    @Column(name = "created_by")
    public Integer createdBy;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
