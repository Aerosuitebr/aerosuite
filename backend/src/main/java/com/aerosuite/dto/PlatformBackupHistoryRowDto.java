package com.aerosuite.dto;

import com.fasterxml.jackson.annotation.JsonFormat;
import java.time.LocalDateTime;

public class PlatformBackupHistoryRowDto {
    public Long id;
    @JsonFormat(pattern = "yyyy-MM-dd'T'HH:mm:ss")
    public LocalDateTime backupDate;
    public long fileSize;
    public String fileSizeLabel;
    public String contentHash;
    public String retentionStatus;
    public String dumpStatus;

    public PlatformBackupHistoryRowDto() {}
}
