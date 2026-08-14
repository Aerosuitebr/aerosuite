package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDateTime;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "parts_search")
public class PartsSearch extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @TenantId
    @Column(name = "tenant_id", nullable = false, length = 64)
    public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;

    @Column(name = "user_id") public Long userId;
    @Column(name = "part_number", nullable = false, length = 100) public String partNumber;
    @Column(name = "normalized_part_number", nullable = false, length = 100) public String normalizedPartNumber;
    @Column(name = "requested_quantity", precision = 15, scale = 3) public BigDecimal requestedQuantity;
    @Column(name = "requested_condition", length = 32) public String requestedCondition;
    @Column(name = "requested_country", length = 100) public String requestedCountry;
    @Column(name = "requested_certification", length = 100) public String requestedCertification;
    @Column(name = "aog", nullable = false) public boolean aog;
    @Column(name = "result_count", nullable = false) public int resultCount;
    @Column(name = "created_at", nullable = false) public LocalDateTime createdAt;

    @PrePersist
    void touch() {
        if (createdAt == null) createdAt = LocalDateTime.now();
    }
}
