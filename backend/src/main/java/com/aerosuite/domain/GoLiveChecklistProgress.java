package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.LocalDateTime;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "go_live_checklist_progress")
public class GoLiveChecklistProgress extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 32)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "item_key", nullable = false, length = 120)
    public String itemKey;

    @Column(name = "concluido", nullable = false)
    public Boolean concluido = false;

    @Column(name = "concluido_em")
    public LocalDateTime concluidoEm;

    @Column(name = "concluido_por_usuario_id")
    public Integer concluidoPorUsuarioId;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public static GoLiveChecklistProgress findByItemKey(String itemKey) {
        return find("itemKey = ?1", itemKey).firstResult();
    }
}
