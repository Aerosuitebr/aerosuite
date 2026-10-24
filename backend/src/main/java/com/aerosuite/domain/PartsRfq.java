package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import org.hibernate.annotations.TenantId;

@Entity
@Table(name = "parts_rfq")
public class PartsRfq extends PanacheEntityBase {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY) public Long id;
    @TenantId @Column(name = "tenant_id", nullable = false, length = 64) public String tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
    @Column(name = "rfq_number", nullable = false, length = 40) public String number;
    @Column(name = "user_id") public Long userId;
    @Column(nullable = false, length = 24) public String status = "DRAFT";
    @Column(nullable = false, length = 180) public String title;
    @Column(nullable = false) public boolean aog;
    @Column(columnDefinition = "TEXT") public String notes;
    @Column(name = "created_at", nullable = false) public LocalDateTime createdAt;
    @Column(name = "updated_at", nullable = false) public LocalDateTime updatedAt;

    @PrePersist void createTimestamps() { createdAt = updatedAt = LocalDateTime.now(); }
    @PreUpdate void updateTimestamp() { updatedAt = LocalDateTime.now(); }
}
