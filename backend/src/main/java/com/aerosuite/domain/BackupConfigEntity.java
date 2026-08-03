package com.aerosuite.domain;

import io.quarkus.hibernate.orm.panache.PanacheEntityBase;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "backup_config")
public class BackupConfigEntity extends PanacheEntityBase {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    public Long id;

    // Conexão com Banco de Dados
    @Column(name = "db_host", nullable = false)
    public String dbHost;

    @Column(name = "db_port", nullable = false)
    public Integer dbPort = 3306;

    @Column(name = "db_database", nullable = false)
    public String dbDatabase;

    @Column(name = "db_username", nullable = false)
    public String dbUsername;

    @Column(name = "db_password", nullable = false, length = 500)
    public String dbPassword;

    @Column(name = "db_ssl_enabled")
    public Boolean dbSslEnabled = false;

    // Caminho de Backup
    @Column(name = "backup_path", nullable = false, length = 500)
    public String backupPath;

    // Agendamento
    @Column(name = "schedule_enabled")
    public Boolean scheduleEnabled = true;

    @Column(name = "schedule_type", length = 20)
    public String scheduleType = "daily"; // 'once', 'daily', 'weekly', 'monthly'

    @Column(name = "scheduled_date")
    public LocalDate scheduledDate;

    @Column(name = "scheduled_time", length = 10)
    public String scheduledTime = "02:00"; // HH:mm

    @Column(name = "days_of_week", length = 50)
    public String daysOfWeek; // JSON array: [0,1,2,3,4,5,6]

    @Column(name = "day_of_month")
    public Integer dayOfMonth; // 1-31

    // Retenção e Compressão
    @Column(name = "retention_days")
    public Integer retentionDays = 30;

    @Column(name = "compress_backup")
    public Boolean compressBackup = true;

    // Notificações
    @Column(name = "email_notification")
    public Boolean emailNotification = false;

    @Column(name = "email_recipients", columnDefinition = "TEXT")
    public String emailRecipients; // JSON array ou CSV

    // Status
    @Column(name = "is_active")
    public Boolean isActive = true;

    // Timestamps
    @Column(name = "created_at", nullable = false)
    public LocalDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    public LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = LocalDateTime.now();
        }
        if (updatedAt == null) {
            updatedAt = LocalDateTime.now();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}

