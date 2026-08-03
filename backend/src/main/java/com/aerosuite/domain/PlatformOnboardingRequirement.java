package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;

@Entity
@Table(name = "platform_onboarding_requirement")
public class PlatformOnboardingRequirement extends PanacheEntityBase {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id", nullable = false)
    public Long tenantId;

    @Column(name = "requirement_key", nullable = false, length = 64)
    public String requirementKey;

    @Column(name = "fulfilled", nullable = false)
    public Boolean fulfilled = false;

    @Column(name = "fulfilled_at")
    public LocalDateTime fulfilledAt;

    @Column(name = "operator_notes", length = 500)
    public String operatorNotes;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    @PreUpdate
    void touch() {
        updatedAt = LocalDateTime.now();
    }

    public static List<PlatformOnboardingRequirement> listForTenant(long tenantId) {
        return list("tenantId = ?1 order by requirementKey", tenantId);
    }
}
