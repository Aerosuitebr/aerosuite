package com.aerosuite.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public record BackupScheduleDto(
    Long id,
    String scheduleType, // "once", "daily", "weekly", "monthly"
    Boolean enabled,
    @JsonFormat(pattern = "yyyy-MM-dd")
    String scheduledDate, // Para agendamento único
    String scheduledTime, // HH:mm
    List<Integer> daysOfWeek, // Para agendamento semanal [0-6]
    Integer dayOfMonth, // Para agendamento mensal [1-31]
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime lastRun,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime nextRun,
    String status, // "pending", "running", "completed", "failed"
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime createdAt,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime updatedAt
) {}

