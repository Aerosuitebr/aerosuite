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
@Table(name = "platform_operator_access")
public class PlatformOperatorAccess extends PanacheEntityBase {

    @Id
    @Column(name = "usuario_id")
    public Integer usuarioId;

    @Column(name = "ativo", nullable = false)
    public Boolean ativo = true;

    @Column(name = "granted_at", nullable = false)
    public LocalDateTime grantedAt;

    @Column(name = "granted_by_usuario_id")
    public Integer grantedByUsuarioId;

    @Column(name = "revoked_at")
    public LocalDateTime revokedAt;

    @Column(name = "revoked_by_usuario_id")
    public Integer revokedByUsuarioId;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    void onCreate() {
        LocalDateTime now = LocalDateTime.now();
        if (grantedAt == null) {
            grantedAt = now;
        }
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    public static PlatformOperatorAccess findActiveByUsuarioId(int usuarioId) {
        return find("usuarioId = ?1 and ativo = true", usuarioId).firstResult();
    }
}
