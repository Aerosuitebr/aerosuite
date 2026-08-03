package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import org.hibernate.annotations.TenantId;

import java.time.LocalDateTime;

@Entity
@Table(
        name = "sistema_config",
        uniqueConstraints = @UniqueConstraint(
                name = "uk_sistema_config_tenant",
                columnNames = {"tenant_id"}))
public class SistemaConfig extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    @Column(name = "id")
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "valores_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    public String valoresJson = "{}";

    @Column(name = "avancadas_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    public String avancadasJson = "{}";

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @Column(name = "updated_by_usuario_id")
    public Integer updatedByUsuarioId;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public static SistemaConfig findForCurrentTenant() {
        return findAll().firstResult();
    }
}
