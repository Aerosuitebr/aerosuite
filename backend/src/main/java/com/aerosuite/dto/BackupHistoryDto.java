package com.aerosuite.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public record BackupHistoryDto(
    Long id,
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    LocalDateTime backupDate,
    String backupPath,
    Long fileSize,
    String status, // "success", "failed"
    String errorMessage,
    Integer duration // em segundos
) {}

