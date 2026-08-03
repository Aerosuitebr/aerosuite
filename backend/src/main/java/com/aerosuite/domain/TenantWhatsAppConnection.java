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
@Table(name = "tenant_whatsapp_connection")
public class TenantWhatsAppConnection extends PanacheEntityBase {

    @Id
    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "whatsapp_instance_name", nullable = false, length = 128, unique = true)
    public String whatsappInstanceName;

    @Column(name = "whatsapp_token_enc", nullable = false, columnDefinition = "TEXT")
    public String whatsappTokenEnc;

    @Column(name = "whatsapp_status", nullable = false, length = 32)
    public String whatsappStatus = WhatsAppConnectionStatus.DISCONNECTED.name();

    @Column(name = "connected_at")
    public LocalDateTime connectedAt;

    @Column(name = "connected_by_usuario_id")
    public Integer connectedByUsuarioId;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public WhatsAppConnectionStatus statusEnum() {
        return WhatsAppConnectionStatus.parse(whatsappStatus);
    }

    public void setStatus(WhatsAppConnectionStatus status) {
        this.whatsappStatus = status.name();
        if (status == WhatsAppConnectionStatus.CONNECTED && connectedAt == null) {
            connectedAt = LocalDateTime.now();
        }
    }

    public static TenantWhatsAppConnection findForTenant(long tenantId) {
        return findById(tenantId);
    }

    public static TenantWhatsAppConnection findByInstanceName(String instanceName) {
        if (instanceName == null || instanceName.isBlank()) {
            return null;
        }
        return find("whatsappInstanceName", instanceName.trim()).firstResult();
    }
}
