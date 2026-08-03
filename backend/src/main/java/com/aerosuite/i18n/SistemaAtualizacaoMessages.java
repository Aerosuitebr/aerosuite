package com.aerosuite.i18n;

/** Chaves i18n (frontend `screens-misc-i18n`) para progresso de atualização do sistema. */
public final class SistemaAtualizacaoMessages {

    private SistemaAtualizacaoMessages() {}

    public static final String NEW_VERSION = "config.update.backend.newVersion";
    public static final String SYSTEM_UP_TO_DATE = "config.update.backend.systemUpToDate";
    public static final String APPROVED_COUNTDOWN = "config.update.backend.approvedCountdown";
    public static final String COUNTDOWN_SAVE_WORK = "config.update.backend.countdownSaveWork";
    public static final String IN_PROGRESS = "config.update.backend.inProgress";
    public static final String CANCELLED_BY_USER = "config.update.backend.cancelledByUser";
    public static final String DOWNLOAD_READY = "config.update.backend.downloadReady";
    public static final String RESTART_COUNTDOWN = "config.update.install.completedRestart";
    public static final String RESTARTING_NOW = "config.update.install.restartingNow";
    public static final String CREATING_FOLDERS = "config.update.backend.creatingFolders";
    public static final String DOWNLOADING_DRIVE = "config.update.backend.downloadingDrive";
    public static final String DOWNLOAD_READY_SUPPORT = "config.update.backend.downloadReadySupport";
    public static final String BACKUP_JAR = "config.update.backend.backupJar";
    public static final String BACKUP_CONFIG = "config.update.backend.backupConfig";
    public static final String BACKUP_FRONTEND = "config.update.backend.backupFrontend";
    public static final String FINISHING_BACKUP = "config.update.backend.finishingBackup";
    public static final String BACKUP_DONE_DOWNLOAD = "config.update.backend.backupDoneDownload";
    public static final String BACKUP_FAILED_CONTINUE = "config.update.backend.backupFailedContinue";
    public static final String VERIFY_NEW_VERSION_FOUND = "config.update.backend.verifyNewVersionFound";
    public static final String VERIFY_UP_TO_DATE_DRIVE = "config.update.backend.verifyUpToDateDrive";

    public static String cancelledByUser() {
        return I18nMessageCodec.encode(CANCELLED_BY_USER);
    }
}
