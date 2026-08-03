package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "platform_onboarding_message")
public class PlatformOnboardingMessage extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "template_code", length = 64)
    public String templateCode;

    @Column(name = "channel", nullable = false, length = 16)
    public String channel = "EMAIL";

    @Column(name = "recipient_email", length = 255)
    public String recipientEmail;

    @Column(name = "recipient_phone", length = 32)
    public String recipientPhone;

    @Column(name = "recipient_name", length = 255)
    public String recipientName;

    @Column(name = "subject", nullable = false, length = 500)
    public String subject;

    @Column(name = "body_html", nullable = false, columnDefinition = "MEDIUMTEXT")
    public String bodyHtml;

    @Column(name = "delivery_status", nullable = false, length = 16)
    public String deliveryStatus = "SENT";

    @Column(name = "operator_email", length = 255)
    public String operatorEmail;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
    }

    public static List<PlatformOnboardingMessage> listForTenant(long tenantId, int limit) {
        return find("tenantId = ?1 order by createdAt desc", tenantId).page(0, limit).list();
    }
}
