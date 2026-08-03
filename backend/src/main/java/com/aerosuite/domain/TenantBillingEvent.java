package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tenant_billing_event")
public class TenantBillingEvent extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "event_type", nullable = false, length = 64)
    public String eventType;

    @Column(name = "title", nullable = false)
    public String title;

    @Column(name = "detail", length = 512)
    public String detail;

    @Column(name = "status", length = 32)
    public String status;

    @Column(name = "amount_cents")
    public Long amountCents;

    @Column(name = "operator_email", length = 255)
    public String operatorEmail;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }
}
