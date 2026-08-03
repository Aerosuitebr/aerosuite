package com.aerosuite.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public record BackupConfigDto(
    Long id,
    DatabaseConnectionDto connection,
    String backupPath,
    BackupScheduleDto schedule,
    Integer retentionDays,
    Boolean compressBackup,
    Boolean emailNotification,
    List<String> emailRecipients,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime createdAt,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime updatedAt
) {}

