package com.aerosuite.dto;

public class PlatformBackupScheduleRequest {
    public String cronPreset;
    public String backupType;
    public String storageTarget;
    public String scheduledTime;
    public Integer retentionDays;
    public Boolean compressBackup;
    public Boolean enabled;

    public PlatformBackupScheduleRequest() {}
}
