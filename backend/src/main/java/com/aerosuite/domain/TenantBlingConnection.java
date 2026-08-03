package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_bling_connection")
public class TenantBlingConnection extends PanacheEntityBase {

    @Id
    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "access_token_enc", nullable = false, columnDefinition = "TEXT")
    public String accessTokenEnc;

    @Column(name = "refresh_token_enc", nullable = false, columnDefinition = "TEXT")
    public String refreshTokenEnc;

    @Column(name = "token_expires_at", nullable = false)
    public LocalDateTime tokenExpiresAt;

    @Column(name = "bling_company_name", length = 255)
    public String blingCompanyName;

    @Column(name = "bling_company_id", length = 64)
    public String blingCompanyId;

    @Column(name = "connected_at", nullable = false)
    public LocalDateTime connectedAt;

    @Column(name = "connected_by_usuario_id")
    public Integer connectedByUsuarioId;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
        if (connectedAt == null) {
            connectedAt = LocalDateTime.now();
        }
    }

    public static TenantBlingConnection findForTenant(long tenantId) {
        return findById(tenantId);
    }

    public static TenantBlingConnection findByBlingCompanyId(String blingCompanyId) {
        if (blingCompanyId == null || blingCompanyId.isBlank()) {
            return null;
        }
        return find("blingCompanyId", blingCompanyId.trim()).firstResult();
    }
}
