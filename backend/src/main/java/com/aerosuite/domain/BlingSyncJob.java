package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.LocalDateTime;

@Entity
@Table(name = "bling_sync_job")
public class BlingSyncJob extends PanacheEntityBase {

    public static final String STATUS_PENDING = "PENDING";
    public static final String STATUS_PROCESSING = "PROCESSING";
    public static final String STATUS_DONE = "DONE";
    public static final String STATUS_FAILED = "FAILED";
    public static final String STATUS_DEAD = "DEAD";

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "tenant_id")
    public Long tenantId;

    @Column(name = "job_type", nullable = false, length = 64)
    public String jobType;

    @Column(name = "payload_json", nullable = false, columnDefinition = "MEDIUMTEXT")
    public String payloadJson;

    @Column(name = "status", nullable = false, length = 20)
    public String status = STATUS_PENDING;

    @Column(name = "attempts", nullable = false)
    public Integer attempts = 0;

    @Column(name = "max_attempts", nullable = false)
    public Integer maxAttempts = 5;

    @Column(name = "next_run_at", nullable = false)
    public LocalDateTime nextRunAt;

    @Column(name = "last_error", length = 1000)
    public String lastError;

    @Column(name = "source_event_id")
    public Long sourceEventId;

    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "processed_at")
    public LocalDateTime processedAt;

    @PrePersist
    void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (nextRunAt == null) {
            nextRunAt = LocalDateTime.now();
        }
    }
}
