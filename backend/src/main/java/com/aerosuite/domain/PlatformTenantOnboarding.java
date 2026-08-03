package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "platform_tenant_onboarding")
public class PlatformTenantOnboarding extends PanacheEntityBase {

    @Id
    @Column(name = "tenant_id")
    public Long tenantId;

    @Column(name = "status", nullable = false, length = 32)
    public String status = "PENDING_INFO";

    @Column(name = "primary_contact_name", length = 255)
    public String primaryContactName;

    @Column(name = "primary_contact_email", length = 255)
    public String primaryContactEmail;

    @Column(name = "notes", columnDefinition = "TEXT")
    public String notes;

    @Column(name = "public_token", length = 64)
    public String publicToken;

    @Column(name = "primary_contact_phone", length = 32)
    public String primaryContactPhone;

    @Column(name = "legal_name", length = 255)
    public String legalName;

    @Column(name = "legal_document", length = 32)
    public String legalDocument;

    @Column(name = "admin_email", length = 255)
    public String adminEmail;

    @Column(name = "support_email", length = 255)
    public String supportEmail;

    @Column(name = "billing_contact_name", length = 255)
    public String billingContactName;

    @Column(name = "billing_contact_email", length = 255)
    public String billingContactEmail;

    @Column(name = "public_submitted_at")
    public LocalDateTime publicSubmittedAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public static PlatformTenantOnboarding findByTenant(long tenantId) {
        return find("tenantId", tenantId).firstResult();
    }

    public static PlatformTenantOnboarding findByPublicToken(String token) {
        if (token == null || token.isBlank()) {
            return null;
        }
        return find("publicToken", token.trim()).firstResult();
    }
}
