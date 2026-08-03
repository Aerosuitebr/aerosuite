package com.aerosuite.service;

import org.jboss.logging.Logger;
import jakarta.enterprise.context.ApplicationScoped;
import java.util.Map;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.CopyOnWriteArrayList;
import java.util.function.Consumer;

@ApplicationScoped
public class BackupProgressBroadcaster {

    private static final Logger LOG = Logger.getLogger(BackupProgressBroadcaster.class);
    private final Map<String, BackupProgress> progressMap = new ConcurrentHashMap<>();
    private final CopyOnWriteArrayList<Consumer<BackupProgress>> listeners = new CopyOnWriteArrayList<>();
    
    public void broadcast(BackupProgress progress) {
        progressMap.put(progress.backupId(), progress);
        LOG.debugf("Broadcasting progresso de backup - ID: %s, Status: %s, Progresso: %d%%, Listeners ativos: %d",
                progress.backupId(), progress.status(), progress.progress(), listeners.size());
        listeners.forEach(listener -> {
            try {
                listener.accept(progress);
            } catch (Exception e) {
                LOG.warnf(e, "Erro ao notificar listener de progresso: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        });
    }
    
    public void addListener(Consumer<BackupProgress> listener) {
        listeners.add(listener);
    }
    
    public void removeListener(Consumer<BackupProgress> listener) {
        listeners.remove(listener);
    }
    
    public BackupProgress getProgress(String backupId) {
        return progressMap.get(backupId);
    }
    
    public java.util.Optional<BackupProgress> getProgressOptional(String backupId) {
        return java.util.Optional.ofNullable(progressMap.get(backupId));
    }
    
    public record BackupProgress(
        String backupId,
        String status, // "running", "success", "error"
        int progress, // 0-100
        String message,
        String errorMessage,
        String backupDate,
        String backupPath
    ) {}
}

