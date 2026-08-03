package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_feature")
@IdClass(TenantFeatureId.class)
public class TenantFeature extends PanacheEntityBase {

    @Id
    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Id
    @Column(name = "feature_code", nullable = false, length = 128)
    public String featureCode;

    @Column(name = "enabled", nullable = false)
    public Boolean enabled = false;

    @Column(name = "config_json", columnDefinition = "JSON")
    public String configJson;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "updated_by_usuario_id")
    public Integer updatedByUsuarioId;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public static TenantFeature findForTenant(long tenantId, String featureCode) {
        return find("tenantId = ?1 and featureCode = ?2", tenantId, featureCode).firstResult();
    }
}
