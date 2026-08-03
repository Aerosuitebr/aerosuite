package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "bling_webhook_event")
public class BlingWebhookEvent extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId = TenantConstants.DEFAULT_TENANT_ID;

    @Column(name = "event_id", nullable = false, length = 120)
    public String eventId;

    @Column(name = "event_type", nullable = false, length = 80)
    public String eventType;

    @Column(name = "resource_id", length = 80)
    public String resourceId;

    @Column(name = "payload_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    public String payloadJson;

    @Column(name = "signature_ok", nullable = false)
    public Boolean signatureOk = false;

    @Column(name = "processing_status", nullable = false, length = 20)
    public String processingStatus = "QUEUED";

    @Column(name = "processed_at")
    public LocalDateTime processedAt;

    @Column(name = "process_note", length = 500)
    public String processNote;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
    }
}
