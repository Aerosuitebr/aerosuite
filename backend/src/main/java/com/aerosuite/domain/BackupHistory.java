package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "backup_history")
public class BackupHistory extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    @Column(name = "backup_date", nullable = false)
    public LocalDateTime backupDate;

    @Column(name = "backup_path", nullable = false, length = 500)
    public String backupPath;

    @Column(name = "file_size", nullable = false)
    public Long fileSize;

    @Column(name = "status", nullable = false, length = 20)
    public String status; // 'running', 'success', 'failed'

    @Column(name = "error_message", columnDefinition = "TEXT")
    public String errorMessage;

    @Column(name = "duration_seconds")
    public Integer durationSeconds;

    @Column(name = "database_name", length = 100)
    public String databaseName;

    @Column(name = "created_at")
    public LocalDateTime createdAt;

    @Column(name = "updated_at")
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

