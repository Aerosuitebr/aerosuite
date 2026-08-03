package com.aerosuite.service;

import com.aerosuite.domain.BackupHistory;
import com.aerosuite.dto.*;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

@ApplicationScoped
public class PlatformBackupControlService {

    @Inject
    TenantProvisioningService tenantProvisioningService;

    @Inject
    BackupConfigService backupConfigService;

    @Transactional
    public PlatformBackupPanelDto getPanel(int limit, int offset) {
        tenantProvisioningService.requirePlatformOperator();
        BackupConfigDto config = backupConfigService.getConfig();
        PlatformBackupPanelDto panel = new PlatformBackupPanelDto();
        if (config != null) {
            BackupScheduleDto schedule = config.schedule();
            if (schedule != null) {
                panel.scheduleEnabled = Boolean.TRUE.equals(schedule.enabled());
                panel.scheduleType = schedule.scheduleType();
                panel.scheduledTime = schedule.scheduledTime();
                panel.cronPreset = mapScheduleToCronPreset(schedule.scheduleType());
                panel.lastSuccessAt = findLastSuccess();
                panel.nextScheduledAt = schedule.nextRun();
            }
            panel.retentionDays = config.retentionDays() != null ? config.retentionDays() : 30;
            panel.compressBackup = config.compressBackup() != null ? config.compressBackup() : true;
            panel.storageTarget = resolveStorageTarget(config.backupPath());
            panel.backupType = panel.compressBackup ? "incremental" : "full";
        } else {
            panel.retentionDays = 30;
            panel.compressBackup = true;
            panel.storageTarget = "local_vps";
            panel.backupType = "full";
        }

        int pageIndex = limit > 0 ? offset / limit : 0;
        List<BackupHistory> rows =
                BackupHistory.find("ORDER BY backupDate DESC").page(pageIndex, limit).list();
        long total = BackupHistory.count();
        panel.totalHistory = total;
        panel.history = new ArrayList<>();
        int retentionDays = panel.retentionDays != null ? panel.retentionDays : 30;
        LocalDateTime purgeBefore = LocalDateTime.now().minusDays(retentionDays);

        for (BackupHistory bh : rows) {
            PlatformBackupHistoryRowDto row = new PlatformBackupHistoryRowDto();
            row.id = bh.id;
            row.backupDate = bh.backupDate;
            row.fileSize = bh.fileSize != null ? bh.fileSize : 0L;
            row.fileSizeLabel = PlatformTelemetryService.formatFileSize(row.fileSize);
            row.contentHash = PlatformTelemetryService.shortHash(bh.id, bh.backupDate, row.fileSize);
            boolean purged = bh.backupDate != null && bh.backupDate.isBefore(purgeBefore);
            row.retentionStatus = purged ? "purged" : "stored";
            row.dumpStatus = "success".equalsIgnoreCase(bh.status) ? "success" : bh.status;
            panel.history.add(row);
        }
        if (panel.lastSuccessAt == null) {
            panel.lastSuccessAt = rows.stream()
                    .filter(b -> "success".equalsIgnoreCase(b.status))
                    .map(b -> b.backupDate)
                    .findFirst()
                    .orElse(null);
        }
        return panel;
    }

    @Transactional
    public PlatformBackupPanelDto updateSchedule(PlatformBackupScheduleRequest request) {
        tenantProvisioningService.requirePlatformOperator();
        BackupConfigDto current = backupConfigService.getConfig();
        if (current == null || request == null) {
            return getPanel(50, 0);
        }
        BackupScheduleDto schedule = current.schedule();
        String scheduleType = mapCronPresetToScheduleType(request.cronPreset, schedule != null ? schedule.scheduleType() : "daily");
        BackupScheduleDto updatedSchedule = new BackupScheduleDto(
                schedule != null ? schedule.id() : null,
                scheduleType,
                request.enabled != null ? request.enabled : schedule != null && Boolean.TRUE.equals(schedule.enabled()),
                schedule != null ? schedule.scheduledDate() : null,
                request.scheduledTime != null ? request.scheduledTime : schedule != null ? schedule.scheduledTime() : "02:00",
                schedule != null ? schedule.daysOfWeek() : List.of(1),
                schedule != null ? schedule.dayOfMonth() : 1,
                schedule != null ? schedule.lastRun() : null,
                schedule != null ? schedule.nextRun() : null,
                schedule != null ? schedule.status() : "pending",
                schedule != null ? schedule.createdAt() : null,
                schedule != null ? schedule.updatedAt() : null);
        BackupConfigDto next = new BackupConfigDto(
                current.id(),
                current.connection(),
                resolveBackupPath(request.storageTarget, current.backupPath()),
                updatedSchedule,
                request.retentionDays != null ? request.retentionDays : current.retentionDays(),
                request.compressBackup != null ? request.compressBackup : current.compressBackup(),
                current.emailNotification(),
                current.emailRecipients(),
                current.createdAt(),
                current.updatedAt());
        backupConfigService.saveConfig(next);
        return getPanel(50, 0);
    }

    private LocalDateTime findLastSuccess() {
        BackupHistory last = BackupHistory.find("status = ?1 ORDER BY backupDate DESC", "success").firstResult();
        return last != null ? last.backupDate : null;
    }

    private static String mapScheduleToCronPreset(String scheduleType) {
        if (scheduleType == null) {
            return "0 2 * * *";
        }
        return switch (scheduleType.toLowerCase(Locale.ROOT)) {
            case "weekly" -> "0 2 * * 1";
            case "monthly" -> "0 2 1 * *";
            case "once" -> "once";
            default -> "0 2 * * *";
        };
    }

    private static String mapCronPresetToScheduleType(String cronPreset, String fallback) {
        if (cronPreset == null || cronPreset.isBlank()) {
            return fallback != null ? fallback : "daily";
        }
        return switch (cronPreset.trim()) {
            case "0 2 * * 1" -> "weekly";
            case "0 2 1 * *" -> "monthly";
            case "once" -> "once";
            default -> "daily";
        };
    }

    private static String resolveStorageTarget(String backupPath) {
        if (backupPath != null && backupPath.toLowerCase(Locale.ROOT).contains("s3")) {
            return "aws_s3";
        }
        return "local_vps";
    }

    private static String resolveBackupPath(String storageTarget, String currentPath) {
        if ("aws_s3".equalsIgnoreCase(storageTarget)) {
            return "s3://aerosuite-backups/";
        }
        if (currentPath != null && !currentPath.isBlank() && !currentPath.toLowerCase(Locale.ROOT).contains("s3")) {
            return currentPath;
        }
        return "/app/backups";
    }
}
