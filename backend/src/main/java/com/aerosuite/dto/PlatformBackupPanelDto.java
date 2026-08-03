package com.aerosuite.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;
import java.util.List;

public class PlatformBackupPanelDto {
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime lastSuccessAt;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime nextScheduledAt;
    public boolean scheduleEnabled;
    public String scheduleType;
    public String scheduledTime;
    public String cronPreset;
    public String backupType;
    public String storageTarget;
    public Integer retentionDays;
    public Boolean compressBackup;
    public List<PlatformBackupHistoryRowDto> history;
    public long totalHistory;

    public PlatformBackupPanelDto() {}
}
