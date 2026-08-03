package com.aerosuite.service;

import org.jboss.logging.Logger;

import com.aerosuite.domain.BackupConfigEntity;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.BackupHistory;
import com.aerosuite.security.BackgroundTenantContext;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.dto.*;
import com.aerosuite.service.BackupProgressBroadcaster.BackupProgress;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.persistence.EntityManager;
import jakarta.persistence.PersistenceContext;
import io.quarkus.runtime.StartupEvent;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import java.io.*;
import java.nio.file.*;
import java.sql.SQLException;
import java.time.*;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.concurrent.CompletableFuture;
import java.util.concurrent.ConcurrentHashMap;
import java.util.concurrent.Executors;
import java.util.concurrent.ScheduledExecutorService;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.zip.GZIPOutputStream;

@ApplicationScoped
public class BackupConfigService {
    private static final Logger LOG = Logger.getLogger(BackupConfigService.class);

    private static ScheduledExecutorService scheduler = Executors.newScheduledThreadPool(2);
    private final Map<String, CompletableFuture<Void>> runningBackups = new HashMap<>();
    private final Map<String, Long> backupIdToHistoryId = new ConcurrentHashMap<>();
    private final ObjectMapper objectMapper = new ObjectMapper();
    private static volatile boolean schedulerInitialized = false;
    private static volatile LocalDateTime lastBackupExecution = null; // Para evitar execuções duplicadas
    
    @PersistenceContext
    EntityManager entityManager;
    
    @Inject
    BackupProgressBroadcaster progressBroadcaster;

    @Inject
    EmailService emailService;

    @Inject
    InternalUserContext internalUserContext;

    @Inject
    BackupJdbcRepository backupJdbcRepository;

    /** Pasta padrão no Windows para mensagens e histórico antigo (/app/backup no container, se existir). */
    @ConfigProperty(name = "aero.suite.backup.host-explorer-folder", defaultValue = "D:/Backup/BD")
    String backupHostExplorerFolder;

    /** Caminho de backup dentro do container Docker (volume montado em docker-compose). */
    @ConfigProperty(name = "aero.suite.backup.container-path", defaultValue = "/app/backups")
    String backupContainerPath;

    // Inicializar scheduler quando a aplicação iniciar
    void onStart(@Observes StartupEvent ev) {
        try {
            // Aguardar um pouco para garantir que o banco de dados está pronto
            Thread.sleep(2000);
            
            // Iniciar monitoramento contínuo (verifica a cada 3 minutos)
            startBackupMonitor();
            schedulerInitialized = true;
        } catch (Exception e) {
            LOG.warnf("Erro ao inicializar scheduler de backup: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
        }
    }
    
    // Monitor contínuo que verifica a cada 3 minutos se é hora de executar backup
    private void startBackupMonitor() {
        Runnable monitorTask = () -> {
            try {
                BackupConfigDto config = backupJdbcRepository.findActiveConfig().orElse(null);
                if (config == null) {
                    return;
                }
                
                if (config.schedule() == null || !config.schedule().enabled()) {
                    return;
                }
                
                BackupScheduleDto schedule = config.schedule();
                String scheduleType = schedule.scheduleType();
                String timeStr = schedule.scheduledTime();
                
                if (schedule.scheduledDate() != null) {
                }
                
                // Verificar se é hora de executar o backup
                if (shouldExecuteBackup(schedule, scheduleType, timeStr)) {
                    // Evitar execuções duplicadas (se executou há menos de 3 minutos, não executa novamente)
                    if (lastBackupExecution == null || 
                        Duration.between(lastBackupExecution, LocalDateTime.now()).toMinutes() >= 3) {
                        lastBackupExecution = LocalDateTime.now();
                        String scheduledBackupId = UUID.randomUUID().toString();
                        performBackup(config, scheduledBackupId);
                    } else {
                        long minutesSinceLastExecution = Duration.between(lastBackupExecution, LocalDateTime.now()).toMinutes();
                    }
                } else {
                }
            } catch (Exception e) {
                LOG.warnf("Erro ao verificar agendamento de backup: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        };
        
        // Executar imediatamente e depois a cada 1 minuto para garantir que não perca execuções
        scheduler.scheduleAtFixedRate(monitorTask, 0, 1, TimeUnit.MINUTES);
    }
    
    // Verifica se é hora de executar o backup baseado no tipo de agendamento
    private boolean shouldExecuteBackup(BackupScheduleDto schedule, String scheduleType, String timeStr) {
        LocalDateTime now = LocalDateTime.now();
        String[] timeParts = timeStr.split(":");
        if (timeParts.length != 2) {
            return false;
        }
        
        int hour = Integer.parseInt(timeParts[0]);
        int minute = Integer.parseInt(timeParts[1]);
        
        int currentHour = now.getHour();
        int currentMinute = now.getMinute();
        
        
        // Calcular se está na janela de tempo uma vez (reutilizar para diferentes tipos de agendamento)
        boolean isInTimeWindow = (currentHour == hour) && 
                                 (currentMinute >= minute && currentMinute <= minute + 2);
        
        switch (scheduleType) {
            case "once":
                // Para agendamento único, verificar data E horário
                if (schedule.scheduledDate() != null) {
                    try {
                        LocalDate scheduledDate = LocalDate.parse(schedule.scheduledDate());
                        LocalDate currentDate = now.toLocalDate();
                        
                        
                        // Verificar se é a data correta
                        if (!currentDate.equals(scheduledDate)) {
                            return false;
                        }
                        
                        // Verificar se está dentro da janela de execução (±2 minutos do horário agendado)
                        // Como o monitor roda a cada 1 minuto, uma janela de 2 minutos é suficiente
                        LocalDateTime scheduledDateTime = scheduledDate.atTime(hour, minute);
                        LocalDateTime windowStart = scheduledDateTime.minusMinutes(2);
                        LocalDateTime windowEnd = scheduledDateTime.plusMinutes(2);
                        
                        
                        boolean inWindow = (now.isAfter(windowStart) || now.isEqual(windowStart)) && 
                                          (now.isBefore(windowEnd) || now.isEqual(windowEnd));
                        
                        if (inWindow) {
                        } else {
                        }
                        
                        return inWindow;
                    } catch (Exception e) {
                        LOG.warnf("Erro ao parsear data agendada: %s", e.getMessage());
                        LOG.warnf(e, "Erro inesperado");
                        return false;
                    }
                }
                return false;
                
            case "daily":
                // Diário: verificar se está dentro da janela de 2 minutos do horário
                if (isInTimeWindow) {
                }
                return isInTimeWindow;
                
            case "weekly":
                // Verificar se hoje é um dos dias da semana configurados E está no horário
                if (schedule.daysOfWeek() != null && !schedule.daysOfWeek().isEmpty()) {
                    int currentDayOfWeek = now.getDayOfWeek().getValue() % 7; // 0=domingo, 1=segunda, etc.
                    boolean isCorrectDay = schedule.daysOfWeek().contains(currentDayOfWeek);
                    
                    
                    return isCorrectDay && isInTimeWindow;
                }
                return false;
                
            case "monthly":
                // Verificar se hoje é o dia do mês configurado E está no horário
                if (schedule.dayOfMonth() != null) {
                    boolean isCorrectDay = now.getDayOfMonth() == schedule.dayOfMonth();
                    
                    
                    return isCorrectDay && isInTimeWindow;
                }
                return false;
                
            default:
                return false;
        }
    }

    @Transactional
    public BackupConfigDto getConfig() {
        try {
            // Usar find().firstResultOptional() para evitar problemas de classloader
            var result = BackupConfigEntity.<BackupConfigEntity>find("isActive = true").firstResultOptional();
            if (result.isEmpty()) {
                return null;
            }
            BackupConfigEntity entity = result.get();
            BackupConfigDto dto = entityToDto(entity);
            return dto;
        } catch (Exception e) {
            LOG.warnf("Erro ao buscar configuração: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return null;
        }
    }

    @Transactional
    public BackupConfigDto saveConfig(BackupConfigDto config) {
        try {
            
            BackupConfigEntity entity;
            
            if (config.id() != null) {
                // Atualizar configuração existente - usar findByIdOptional para evitar problemas de classloader
                var foundEntity = BackupConfigEntity.<BackupConfigEntity>findByIdOptional(config.id());
                if (foundEntity.isEmpty()) {
                    throw new RuntimeException(
                            ApiI18nMessages.encode(
                                    ApiI18nMessages.BACKUP_CONFIG_NOT_FOUND, "id", String.valueOf(config.id())));
                }
                entity = foundEntity.get();
        } else {
            // Desativar outras configurações e criar nova
            try {
                BackupConfigEntity.update("isActive = false");
            } catch (Exception e) {
                // Se a tabela não existir, apenas criar nova configuração
            }
            entity = new BackupConfigEntity();
        }
        
        // Preencher dados da conexão (campos obrigatórios)
        DatabaseConnectionDto conn = config.connection();
        if (conn == null) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_CONNECTION_DATA_REQUIRED));
        }
        
        entity.dbHost = conn.host() != null ? conn.host() : "";
        entity.dbPort = conn.port() != null ? conn.port() : 3306;
        entity.dbDatabase = conn.database() != null ? conn.database() : "";
        entity.dbUsername = conn.username() != null ? conn.username() : "";
        entity.dbPassword = conn.password() != null ? conn.password() : "";
        entity.dbSslEnabled = conn.sslEnabled() != null ? conn.sslEnabled() : false;
        
        // Preencher caminho de backup (obrigatório)
        if (config.backupPath() == null || config.backupPath().isBlank()) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PATH_REQUIRED));
        }
        entity.backupPath = config.backupPath();
        
        // Preencher agendamento
        BackupScheduleDto schedule = config.schedule();
        if (schedule != null) {
            entity.scheduleEnabled = schedule.enabled() != null ? schedule.enabled() : true;
            entity.scheduleType = schedule.scheduleType() != null ? schedule.scheduleType() : "daily";
            entity.scheduledDate = schedule.scheduledDate() != null && !schedule.scheduledDate().isBlank() 
                ? LocalDate.parse(schedule.scheduledDate()) : null;
            entity.scheduledTime = schedule.scheduledTime() != null && !schedule.scheduledTime().isBlank() 
                ? schedule.scheduledTime() : "02:00";
            
            // Serializar daysOfWeek como JSON
            if (schedule.daysOfWeek() != null && !schedule.daysOfWeek().isEmpty()) {
                try {
                    entity.daysOfWeek = objectMapper.writeValueAsString(schedule.daysOfWeek());
                } catch (Exception e) {
                    LOG.warnf("Erro ao serializar daysOfWeek: %s", e.getMessage());
                    entity.daysOfWeek = null;
                }
            } else {
                entity.daysOfWeek = null;
            }
            
            entity.dayOfMonth = schedule.dayOfMonth();
        } else {
            // Valores padrão se schedule não for fornecido
            entity.scheduleEnabled = true;
            entity.scheduleType = "daily";
            entity.scheduledDate = null;
            entity.scheduledTime = "02:00";
            entity.daysOfWeek = null;
            entity.dayOfMonth = null;
        }
        
        // Preencher retenção e compressão
        entity.retentionDays = config.retentionDays() != null ? config.retentionDays() : 30;
        entity.compressBackup = config.compressBackup() != null ? config.compressBackup() : true;
        
        // Preencher notificações
        entity.emailNotification = config.emailNotification() != null ? config.emailNotification() : false;
        if (config.emailRecipients() != null && !config.emailRecipients().isEmpty()) {
            try {
                entity.emailRecipients = objectMapper.writeValueAsString(config.emailRecipients());
            } catch (Exception e) {
                LOG.warnf("Erro ao serializar emailRecipients: %s", e.getMessage());
                entity.emailRecipients = null;
            }
        } else {
            entity.emailRecipients = null;
        }
        
        entity.isActive = true;
        
        // Garantir que timestamps sejam definidos
        if (entity.createdAt == null) {
            entity.createdAt = LocalDateTime.now();
        }
        if (entity.updatedAt == null) {
            entity.updatedAt = LocalDateTime.now();
        }
        
        // Validar campos obrigatórios antes de persistir
        if (entity.dbHost == null || entity.dbHost.isBlank()) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_HOST_EMPTY));
        }
        if (entity.dbDatabase == null || entity.dbDatabase.isBlank()) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_DATABASE_EMPTY));
        }
        if (entity.dbUsername == null || entity.dbUsername.isBlank()) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_USER_EMPTY));
        }
        if (entity.backupPath == null || entity.backupPath.isBlank()) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PATH_REQUIRED));
        }
        
        // Garantir valores padrão para campos opcionais
        if (entity.dbPort == null) {
            entity.dbPort = 3306;
        }
        if (entity.dbPassword == null) {
            entity.dbPassword = "";
        }
        if (entity.dbSslEnabled == null) {
            entity.dbSslEnabled = false;
        }
        if (entity.scheduleEnabled == null) {
            entity.scheduleEnabled = true;
        }
        if (entity.scheduleType == null || entity.scheduleType.isBlank()) {
            entity.scheduleType = "daily";
        }
        if (entity.scheduledTime == null || entity.scheduledTime.isBlank()) {
            entity.scheduledTime = "02:00";
        }
        if (entity.retentionDays == null) {
            entity.retentionDays = 30;
        }
        if (entity.compressBackup == null) {
            entity.compressBackup = true;
        }
        if (entity.emailNotification == null) {
            entity.emailNotification = false;
        }
        if (entity.isActive == null) {
            entity.isActive = true;
        }
        
        // Log dos valores antes de persistir (sem senha)
        
        // Persistir
        try {
            entity.persist();
        } catch (Exception persistError) {
            LOG.warnf("  Mensagem: %s", "Erro ao persistir entidade:");
            LOG.warnf(persistError.getMessage());
            LOG.warnf(persistError, "Erro inesperado");
            throw new RuntimeException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.BACKUP_PERSIST_FAILED, persistError.getMessage()),
                    persistError);
        }
        
        // Converter para DTO e agendar backup
        BackupConfigDto savedConfig = entityToDto(entity);
        scheduleBackup(savedConfig);
        
        return savedConfig;
        } catch (Exception e) {
            LOG.warnf("Erro ao salvar configuração: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.BACKUP_SAVE_FAILED, e.getMessage()), e);
        }
    }
    
    private BackupConfigDto entityToDto(BackupConfigEntity entity) {
        // Converter conexão
        DatabaseConnectionDto connection = new DatabaseConnectionDto(
            entity.dbHost,
            entity.dbPort,
            entity.dbDatabase,
            entity.dbUsername,
            entity.dbPassword,
            entity.dbSslEnabled
        );
        
        // Converter agendamento
        List<Integer> daysOfWeek = null;
        if (entity.daysOfWeek != null && !entity.daysOfWeek.isBlank()) {
            try {
                daysOfWeek = objectMapper.readValue(entity.daysOfWeek, new TypeReference<List<Integer>>() {});
            } catch (Exception e) {
                LOG.warnf("Erro ao deserializar daysOfWeek: %s", e.getMessage());
            }
        }
        
        BackupScheduleDto schedule = new BackupScheduleDto(
            null, // id
            entity.scheduleType,
            entity.scheduleEnabled,
            entity.scheduledDate != null ? entity.scheduledDate.toString() : null,
            entity.scheduledTime,
            daysOfWeek,
            entity.dayOfMonth,
            null, // lastRun
            null, // nextRun
            null, // status
            null, // createdAt
            null  // updatedAt
        );
        
        // Converter email recipients
        List<String> emailRecipients = null;
        if (entity.emailRecipients != null && !entity.emailRecipients.isBlank()) {
            try {
                emailRecipients = objectMapper.readValue(entity.emailRecipients, new TypeReference<List<String>>() {});
            } catch (Exception e) {
                LOG.warnf("Erro ao deserializar emailRecipients: %s", e.getMessage());
            }
        }
        
        return new BackupConfigDto(
            entity.id,
            connection,
            entity.backupPath,
            schedule,
            entity.retentionDays,
            entity.compressBackup,
            entity.emailNotification,
            emailRecipients,
            entity.createdAt,
            entity.updatedAt
        );
    }

    public Map<String, Object> testConnection(DatabaseConnectionDto connection) {
        try {
            // Validar dados de entrada
            if (connection.host() == null || connection.host().isBlank()) {
                return Map.of("success", false, "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_HOST_EMPTY));
            }
            if (connection.port() == null || connection.port() < 1 || connection.port() > 65535) {
                return Map.of("success", false, "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PORT_INVALID));
            }
            if (connection.database() == null || connection.database().isBlank()) {
                return Map.of("success", false, "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_DATABASE_EMPTY));
            }
            if (connection.username() == null || connection.username().isBlank()) {
                return Map.of("success", false, "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_USER_EMPTY));
            }
            
            // Construir URL de conexão MySQL
            boolean useSSL = connection.sslEnabled() != null && connection.sslEnabled();
            String url = String.format(
                "jdbc:mysql://%s:%d/%s?useSSL=%s&allowPublicKeyRetrieval=true&serverTimezone=UTC&autoReconnect=true",
                connection.host(),
                connection.port(),
                connection.database(),
                useSSL ? "true" : "false"
            );
            
            
            // Tentar conexão com timeout
            try (var conn = java.sql.DriverManager.getConnection(
                    url, 
                    connection.username(), 
                    connection.password())) {
                
                // Testar se a conexão está realmente funcionando
                boolean isValid = conn.isValid(5); // timeout de 5 segundos
                
                if (isValid) {
                    return Map.of(
                        "success", true,
                        "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_CONNECT_SUCCESS)
                    );
                } else {
                    return Map.of(
                        "success", false,
                        "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_CONNECT_INVALID)
                    );
                }
            }
        } catch (java.sql.SQLException e) {
            String errorMsg = ApiI18nMessages.withDetail(ApiI18nMessages.BACKUP_CONNECT_ERROR, e.getMessage());
            LOG.warnf("%s", String.valueOf(errorMsg));
            LOG.warnf("SQL State: %s", e.getSQLState());
            LOG.warnf("Error Code: %s", e.getErrorCode());
            LOG.warnf(e, "Erro inesperado");

            if (e.getMessage() != null && e.getMessage().contains("Access denied")) {
                errorMsg = ApiI18nMessages.encode(ApiI18nMessages.BACKUP_ACCESS_DENIED);
            } else if (e.getMessage() != null && e.getMessage().contains("Unknown database")) {
                errorMsg = ApiI18nMessages.encode(ApiI18nMessages.BACKUP_DB_NOT_FOUND, "database", connection.database());
            } else if (e.getMessage() != null
                    && (e.getMessage().contains("Communications link failure")
                            || e.getMessage().contains("Connection refused"))) {
                errorMsg = ApiI18nMessages.encode(ApiI18nMessages.BACKUP_CONNECTION_FAILED);
            } else if (e.getMessage() != null && e.getMessage().toLowerCase().contains("timeout")) {
                errorMsg = ApiI18nMessages.encode(ApiI18nMessages.BACKUP_TIMEOUT);
            }

            return Map.of("success", false, "message", errorMsg);
        } catch (Exception e) {
            String errorMsg = ApiI18nMessages.withDetail(ApiI18nMessages.BACKUP_UNEXPECTED, e.getMessage());
            LOG.warnf("%s", String.valueOf(errorMsg));
            LOG.warnf(e, "Erro inesperado");
            return Map.of("success", false, "message", errorMsg);
        }
    }

    public Map<String, Object> executeBackup() {
        BackupConfigDto config = getConfig();
        if (config == null) {
            return Map.of(
                "success", false,
                "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_CONFIG_NOT_FOUND)
            );
        }

        String backupId = UUID.randomUUID().toString();
        long tenantId = internalUserContext.getTenantId() != null
                ? internalUserContext.getTenantId()
                : TenantConstants.DEFAULT_TENANT_ID;
        CompletableFuture<Void> future = CompletableFuture.runAsync(() -> {
            try {
                BackgroundTenantContext.runAs(tenantId, () -> performBackup(config, backupId));
            } catch (Exception e) {
                LOG.warnf("Erro na thread de backup: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        });

        runningBackups.put(backupId, future);
        
        return Map.of(
            "success", true,
            "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_STARTED),
            "backupId", backupId
        );
    }

    private void performBackup(BackupConfigDto config, String backupId) {
        long startTime = System.currentTimeMillis();
        long historyId = 0L;
        String errorMessage = null;
        Path backupFile = null;
        
        try {
            DatabaseConnectionDto conn = config.connection();
            String backupPath = config.backupPath();
            
            if (runningInsideDocker() && backupPath != null) {
                try {
                    backupPath = windowsPathToContainerPath(backupPath);
                } catch (RuntimeException ex) {
                    throw new RuntimeException(ex.getMessage(), ex);
                }
            }
            
            
            // Notificar início do backup
            progressBroadcaster.broadcast(new BackupProgress(
                backupId, "running", 0, "Iniciando backup...", null, null, null
            ));
            
            historyId = backupJdbcRepository.insertRunningHistory(backupPath, conn.database());
            backupIdToHistoryId.put(backupId, historyId);
            
            // Notificar preparação
            progressBroadcaster.broadcast(new BackupProgress(
                backupId, "running", 10, "Preparando ambiente...", null, null, null
            ));
            
            // Criar diretório se não existir
            Path backupDir = Paths.get(backupPath);
            
            if (!Files.exists(backupDir)) {
                Files.createDirectories(backupDir);
            } else {
            }
            
            // Verificar permissões de escrita
            if (!Files.isWritable(backupDir)) {
                throw new RuntimeException(
                        ApiI18nMessages.encode(ApiI18nMessages.BACKUP_DIR_NOT_WRITABLE, "path", backupDir.toString()));
            }

            // Gerar nome do arquivo de backup
            String timestamp = LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd_HHmmss"));
            String fileName = String.format("backup_%s_%s.sql", conn.database(), timestamp);
            if (config.compressBackup() != null && config.compressBackup()) {
                fileName += ".gz";
            }
            
            backupFile = backupDir.resolve(fileName);

            // Executar mysqldump
            String mysqldumpHost = resolveMysqldumpHost(conn.host());
            List<String> command = new ArrayList<>();
            command.add("mysqldump");
            command.add("-h" + mysqldumpHost);
            command.add("-P" + conn.port());
            command.add("-u" + conn.username());
            command.add("-p" + conn.password());
            if (conn.sslEnabled() != null && conn.sslEnabled()) {
                command.add("--ssl-mode=REQUIRED");
            }
            command.add("--single-transaction");
            command.add("--routines");
            command.add("--triggers");
            command.add(conn.database());


            // Notificar início da exportação
            progressBroadcaster.broadcast(new BackupProgress(
                backupId, "running", 20, "Conectando ao banco de dados...", null, null, null
            ));

            ProcessBuilder pb = new ProcessBuilder(command);
            pb.redirectErrorStream(true);
            
            Process process = pb.start();
            
            // Notificar exportação em andamento
            progressBroadcaster.broadcast(new BackupProgress(
                backupId, "running", 30, "Exportando dados...", null, null, null
            ));
            
            // Capturar erros do processo
            StringBuilder errorOutput = new StringBuilder();
            Thread errorReader = new Thread(() -> {
                try (BufferedReader reader = new BufferedReader(
                        new InputStreamReader(process.getErrorStream()))) {
                    String line;
                    while ((line = reader.readLine()) != null) {
                        errorOutput.append(line).append("\n");
                        LOG.warnf("mysqldump stderr: %s", line);
                    }
                } catch (IOException e) {
                    LOG.warnf("Erro ao ler stderr: %s", e.getMessage());
                }
            });
            errorReader.start();
            
            // Redirecionar saída para arquivo
            long bytesWritten = 0;
            long totalBytes = 0; // Estimativa total (será atualizada durante o processo)
            try (OutputStream outputStream = Files.newOutputStream(backupFile);
                 InputStream inputStream = process.getInputStream()) {
                
                if (config.compressBackup() != null && config.compressBackup()) {
                    // Comprimir durante a escrita
                    try (GZIPOutputStream gzipOut = new GZIPOutputStream(outputStream)) {
                        byte[] buffer = new byte[8192];
                        int bytesRead;
                        int updateCounter = 0;
                        while ((bytesRead = inputStream.read(buffer)) != -1) {
                            gzipOut.write(buffer, 0, bytesRead);
                            bytesWritten += bytesRead;
                            totalBytes += bytesRead;
                            
                            // Atualizar progresso a cada 1MB processado
                            updateCounter++;
                            if (updateCounter % 128 == 0) { // ~1MB (128 * 8192)
                                int progress = Math.min(30 + (int)((totalBytes / 1024.0 / 1024.0) % 60), 85);
                                progressBroadcaster.broadcast(new BackupProgress(
                                    backupId, "running", progress, 
                                    String.format("Processando dados... (%.1f MB)", totalBytes / 1024.0 / 1024.0),
                                    null, null, null
                                ));
                            }
                        }
                        gzipOut.finish();
                    }
                } else {
                    byte[] buffer = new byte[8192];
                    int bytesRead;
                    int updateCounter = 0;
                    while ((bytesRead = inputStream.read(buffer)) != -1) {
                        outputStream.write(buffer, 0, bytesRead);
                        bytesWritten += bytesRead;
                        totalBytes += bytesRead;
                        
                        // Atualizar progresso a cada 1MB processado
                        updateCounter++;
                        if (updateCounter % 128 == 0) { // ~1MB
                            int progress = Math.min(30 + (int)((totalBytes / 1024.0 / 1024.0) % 60), 85);
                            progressBroadcaster.broadcast(new BackupProgress(
                                backupId, "running", progress,
                                String.format("Processando dados... (%.1f MB)", totalBytes / 1024.0 / 1024.0),
                                null, null, null
                            ));
                        }
                    }
                }
            }
            
            // Notificar finalização
            progressBroadcaster.broadcast(new BackupProgress(
                backupId, "running", 90, "Finalizando backup...", null, null, null
            ));
            
            // Aguardar leitor de erro terminar
            errorReader.join(1000);

            int exitCode = process.waitFor();
            long duration = (System.currentTimeMillis() - startTime) / 1000;
            
            
            if (exitCode != 0) {
                String errorMsg = errorOutput.length() > 0 ? errorOutput.toString() : "mysqldump falhou com código de saída: " + exitCode;
                throw new RuntimeException(errorMsg);
            }
            
            // Verificar se o arquivo foi criado
            if (!Files.exists(backupFile)) {
                throw new RuntimeException(
                        ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FILE_NOT_CREATED, "path", backupFile.toString()));
            }
            
            long fileSize = Files.size(backupFile);
            
            if (fileSize == 0) {
                throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FILE_EMPTY));
            }

            backupJdbcRepository.markSuccess(historyId, backupFile.toAbsolutePath().toString(), fileSize, (int) duration);

            LOG.infof(
                "=== BACKUP CONCLUÍDO COM SUCESSO ===\n" +
                "Arquivo: %s\n" +
                "Tamanho: %d bytes\n" +
                "Duração: %d segundos",
                backupFile.toString(),
                fileSize,
                duration
            );
            
            // Notificar sucesso
            progressBroadcaster.broadcast(new BackupProgress(
                backupId, "success", 100,
                String.format("Backup concluído com sucesso! (%d segundos)", duration),
                null,
                LocalDateTime.now().toString(),
                backupFile.toAbsolutePath().toString()
            ));

            if (Boolean.TRUE.equals(config.emailNotification()) && config.emailRecipients() != null) {
                try {
                    emailService.sendBackupCompletedEmail(
                            config.emailRecipients(),
                            conn.database(),
                            backupFile.toAbsolutePath().toString(),
                            fileSize,
                            (int) duration);
                } catch (Exception mailEx) {
                    LOG.warnf("Falha ao enviar e-mail pós-backup: %s", mailEx.getMessage());
                }
            }

            // Limpar backups antigos
            cleanupOldBackups(backupPath, config.retentionDays() != null ? config.retentionDays() : 30);

        } catch (Exception e) {
            errorMessage = e.getMessage();
            LOG.warnf("Mensagem: %s", "=== ERRO AO EXECUTAR BACKUP ===");
            LOG.warnf(errorMessage);
            LOG.warnf(e, "Erro inesperado");
            
            // Notificar erro
            String finalErrorMessage = errorMessage != null && errorMessage.length() > 200 
                ? errorMessage.substring(0, 200) + "..." 
                : errorMessage;
            progressBroadcaster.broadcast(new BackupProgress(
                backupId, "error", 0,
                "Erro ao executar backup",
                finalErrorMessage,
                null,
                null
            ));
            
            // Tentar deletar arquivo vazio ou inválido
            if (backupFile != null && Files.exists(backupFile)) {
                try {
                    long fileSize = Files.size(backupFile);
                    if (fileSize == 0) {
                        Files.delete(backupFile);
                    }
                } catch (Exception deleteEx) {
                    LOG.warnf("Erro ao deletar arquivo inválido: %s", deleteEx.getMessage());
                }
            }
            
            if (historyId > 0) {
                try {
                    int dur = (int) ((System.currentTimeMillis() - startTime) / 1000);
                    backupJdbcRepository.markFailed(historyId, errorMessage, dur);
                } catch (Exception ex) {
                    LOG.warnf("Erro ao atualizar histórico de backup: %s", ex.getMessage());
                    LOG.warnf(ex, "Erro inesperado");
                }
            }
        } finally {
            runningBackups.remove(backupId);
        }
    }

    @Transactional
    public Map<String, Object> getBackupStatus(String backupId) {
        // Verificar se o backup ainda está em execução
        if (runningBackups.containsKey(backupId)) {
            CompletableFuture<Void> future = runningBackups.get(backupId);
            if (!future.isDone()) {
                return Map.of(
                    "status", "running",
                    "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_IN_PROGRESS),
                    "backupId", backupId
                );
            }
        }
        
        Long historyId = backupIdToHistoryId.get(backupId);
        if (historyId != null) {
            try {
                var row = backupJdbcRepository.findHistoryById(historyId);
                if (row.isPresent()) {
                    var h = row.get();
                    return Map.of(
                        "status", h.status(),
                        "message",
                                "success".equals(h.status())
                                        ? ApiI18nMessages.encode(ApiI18nMessages.BACKUP_COMPLETED)
                                        : ("failed".equals(h.status())
                                                ? ApiI18nMessages.withDetail(
                                                        ApiI18nMessages.BACKUP_FAILED,
                                                        h.errorMessage() != null
                                                                ? h.errorMessage()
                                                                : ApiI18nMessages.encode(ApiI18nMessages.COMMON_UNEXPECTED_ERROR))
                                                : ApiI18nMessages.encode(ApiI18nMessages.BACKUP_IN_PROGRESS)),
                        "backupId", backupId,
                        "backupDate", h.backupDate().toString(),
                        "backupPath", h.backupPath() != null ? h.backupPath() : "",
                        "fileSize", h.fileSize(),
                        "errorMessage", h.errorMessage() != null ? h.errorMessage() : ""
                    );
                }
            } catch (SQLException e) {
                LOG.warnf("Erro ao buscar status backup JDBC: %s", e.getMessage());
            }
        }
        
        return Map.of(
            "status", "unknown",
            "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_STATUS_NOT_FOUND),
            "backupId", backupId
        );
    }

    private void cleanupOldBackups(String backupPath, int retentionDays) {
        try {
            Path backupDir = Paths.get(backupPath);
            if (!Files.exists(backupDir)) {
                return;
            }

            LocalDateTime cutoffDate = LocalDateTime.now().minusDays(retentionDays);
            
            Files.list(backupDir)
                .filter(Files::isRegularFile)
                .filter(path -> {
                    try {
                        LocalDateTime fileTime = LocalDateTime.ofInstant(
                            Files.getLastModifiedTime(path).toInstant(),
                            ZoneId.systemDefault()
                        );
                        return fileTime.isBefore(cutoffDate);
                    } catch (IOException e) {
                        return false;
                    }
                })
                .forEach(path -> {
                    try {
                        Files.delete(path);
                    } catch (IOException e) {
                        LOG.warnf("Erro ao excluir backup antigo: %s", path);
                    }
                });
        } catch (IOException e) {
            LOG.warnf("Erro ao limpar backups antigos: %s", e.getMessage());
        }
    }

    private void scheduleBackup(BackupConfigDto config) {
        // Com o novo sistema de monitoramento contínuo, não precisamos mais agendar tarefas específicas
        // O monitor já está rodando e verificando a cada 1 minuto
        if (config.schedule() != null) {
            if (config.schedule().scheduledDate() != null) {
            }
        }
    }

    private void scheduleDaily(int hour, int minute, Runnable task) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextRun = now.withHour(hour).withMinute(minute).withSecond(0).withNano(0);
        
        if (nextRun.isBefore(now) || nextRun.isEqual(now)) {
            nextRun = nextRun.plusDays(1);
        }
        
        long initialDelay = Duration.between(now, nextRun).toSeconds();
        
        scheduler.scheduleAtFixedRate(task, initialDelay, 24 * 60 * 60, TimeUnit.SECONDS);
    }

    private void scheduleWeekly(List<Integer> daysOfWeek, int hour, int minute, Runnable task) {
        // Implementação simplificada - em produção, usar Quartz ou similar
        LocalDateTime now = LocalDateTime.now();
        int currentDayOfWeek = now.getDayOfWeek().getValue() % 7;
        
        for (int day : daysOfWeek) {
            int daysUntil = (day - currentDayOfWeek + 7) % 7;
            if (daysUntil == 0 && now.getHour() < hour || (now.getHour() == hour && now.getMinute() < minute)) {
                daysUntil = 7;
            }
            
            LocalDateTime nextRun = now.plusDays(daysUntil).withHour(hour).withMinute(minute).withSecond(0);
            long delay = Duration.between(now, nextRun).toSeconds();
            scheduler.schedule(task, delay, TimeUnit.SECONDS);
        }
    }

    private void scheduleMonthly(int dayOfMonth, int hour, int minute, Runnable task) {
        LocalDateTime now = LocalDateTime.now();
        LocalDateTime nextRun = now.withDayOfMonth(dayOfMonth).withHour(hour).withMinute(minute).withSecond(0);
        
        if (nextRun.isBefore(now)) {
            nextRun = nextRun.plusMonths(1);
        }
        
        long initialDelay = Duration.between(now, nextRun).toSeconds();
        scheduler.scheduleAtFixedRate(task, initialDelay, 30L * 24 * 60 * 60, TimeUnit.SECONDS);
    }

    @Transactional
    public List<BackupHistoryDto> getBackupHistory(int limit) {
        List<BackupHistoryDto> history = new ArrayList<>();
        
        try {
            // Buscar do banco de dados ordenado por data (mais recente primeiro)
            List<BackupHistory> backupHistoryList = BackupHistory.find(
                "ORDER BY backupDate DESC"
            ).page(0, limit).list();
            
            // Converter entidades para DTOs
            for (BackupHistory bh : backupHistoryList) {
                String pathForUi = runningInsideDocker()
                    ? containerPathToWindowsPath(bh.backupPath) : bh.backupPath;
                BackupHistoryDto dto = new BackupHistoryDto(
                    bh.id,
                    bh.backupDate,
                    pathForUi,
                    bh.fileSize,
                    bh.status,
                    bh.errorMessage,
                    bh.durationSeconds
                );
                history.add(dto);
            }
        } catch (Exception e) {
            LOG.warnf("Erro ao buscar histórico de backups do banco: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
        }
        
        return history;
    }

    public Map<String, Object> validatePath(String path) {
        try {
            String resolved = path;
            if (runningInsideDocker() && path != null && isWindowsStylePath(path)) {
                resolved = windowsPathToContainerPath(path);
            }
            Path testPath = Paths.get(resolved);
            
            // Verificar se o caminho é válido
            if (!Files.exists(testPath)) {
                // Tentar criar o diretório
                Files.createDirectories(testPath);
            }
            
            // Verificar permissões de escrita
            Path testFile = testPath.resolve(".backup_test_" + System.currentTimeMillis());
            Files.createFile(testFile);
            Files.delete(testFile);
            
            return Map.of(
                "valid", true,
                "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PATH_VALID)
            );
        } catch (Exception e) {
            return Map.of(
                "valid", false,
                "message", ApiI18nMessages.withDetail(ApiI18nMessages.BACKUP_PATH_ERROR, e.getMessage())
            );
        }
    }

    @Transactional
    public void deleteBackup(Long backupId) {
        try {
            BackupHistory history = BackupHistory.findById(backupId);
            if (history != null) {
                // Tentar excluir o arquivo físico se existir
                try {
                    String delPath = history.backupPath;
                    if (runningInsideDocker() && isWindowsStylePath(delPath)) {
                        delPath = windowsPathToContainerPath(delPath);
                    }
                    Path backupFile = Paths.get(delPath);
                    if (Files.exists(backupFile)) {
                        Files.delete(backupFile);
                    }
                } catch (Exception e) {
                    LOG.warnf("Erro ao excluir arquivo de backup: %s", e.getMessage());
                    // Continuar mesmo se não conseguir excluir o arquivo
                }
                
                // Excluir registro do banco
                history.delete();
            }
        } catch (Exception e) {
            LOG.warnf("Erro ao excluir backup: %s", e.getMessage());
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.BACKUP_DELETE_FAILED, e.getMessage()), e);
        }
    }

    public Map<String, Object> listDirectories(String path) {
        try {
            Path basePath;
            
            if (path == null || path.isBlank()) {
                List<Map<String, Object>> directories = new ArrayList<>();

                if (runningInsideDocker()) {
                    for (char letter = 'C'; letter <= 'Z'; letter++) {
                        Path mp = Paths.get("/mnt/win_" + Character.toLowerCase(letter));
                        if (Files.exists(mp) && Files.isDirectory(mp)) {
                            Map<String, Object> dirMap = new HashMap<>();
                            dirMap.put("name", letter + ":");
                            dirMap.put("path", letter + ":\\");
                            dirMap.put("isDirectory", true);
                            dirMap.put("canRead", Files.isReadable(mp));
                            dirMap.put("canWrite", Files.isWritable(mp));
                            directories.add(dirMap);
                        }
                    }
                } else {
                    String os = System.getProperty("os.name").toLowerCase();
                    if (os.contains("win")) {
                        File[] roots = File.listRoots();
                        for (File root : roots) {
                            String rootPath = root.getAbsolutePath();
                            Map<String, Object> dirMap = new HashMap<>();
                            dirMap.put("name", rootPath.replace("\\", ""));
                            dirMap.put("path", rootPath);
                            dirMap.put("isDirectory", true);
                            dirMap.put("canRead", root.canRead());
                            dirMap.put("canWrite", root.canWrite());
                            directories.add(dirMap);
                        }
                    } else {
                        String[] commonRoots = {"/", "/home", "/var", "/usr", "/tmp", "/opt"};
                        for (String root : commonRoots) {
                            Path rootPath = Paths.get(root);
                            if (Files.exists(rootPath) && Files.isDirectory(rootPath)) {
                                Map<String, Object> dirMap = new HashMap<>();
                                dirMap.put("name", rootPath.getFileName() != null ? rootPath.getFileName().toString() : root);
                                dirMap.put("path", root);
                                dirMap.put("isDirectory", true);
                                dirMap.put("canRead", Files.isReadable(rootPath));
                                dirMap.put("canWrite", Files.isWritable(rootPath));
                                directories.add(dirMap);
                            }
                        }
                    }
                }

                Map<String, Object> result = new HashMap<>();
                result.put("path", "");
                result.put("directories", directories);
                return result;
            } else {
                String containerSide = path;
                if (runningInsideDocker() && isWindowsStylePath(path)) {
                    containerSide = windowsPathToContainerPath(path);
                }
                basePath = Paths.get(containerSide);
                
                if (!Files.exists(basePath)) {
                    throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FOLDER_NOT_FOUND, "path", path));
                }
                
                if (!Files.isDirectory(basePath)) {
                    throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FOLDER_NOT_DIR, "path", path));
                }
                
                List<Map<String, Object>> directories = Files.list(basePath)
                    .filter(Files::isDirectory)
                    .map(dirPath -> {
                        Map<String, Object> dirMap = new HashMap<>();
                        try {
                            dirMap.put("name", dirPath.getFileName().toString());
                            String pOut = runningInsideDocker()
                                ? containerPathToWindowsPath(dirPath.toAbsolutePath().toString().replace('\\', '/'))
                                : dirPath.toAbsolutePath().toString();
                            dirMap.put("path", pOut);
                            dirMap.put("isDirectory", true);
                            dirMap.put("canRead", Files.isReadable(dirPath));
                            dirMap.put("canWrite", Files.isWritable(dirPath));
                        } catch (Exception e) {
                            // Se houver qualquer erro ao verificar permissões, assumir sem permissões
                            dirMap.put("name", dirPath.getFileName() != null ? dirPath.getFileName().toString() : dirPath.toString());
                            dirMap.put("path", runningInsideDocker()
                                ? containerPathToWindowsPath(dirPath.toAbsolutePath().toString().replace('\\', '/'))
                                : dirPath.toAbsolutePath().toString());
                            dirMap.put("isDirectory", true);
                            dirMap.put("canRead", false);
                            dirMap.put("canWrite", false);
                        }
                        return dirMap;
                    })
                    .sorted((a, b) -> {
                        String nameA = (String) a.get("name");
                        String nameB = (String) b.get("name");
                        return nameA.compareToIgnoreCase(nameB);
                    })
                    .collect(Collectors.toList());
                
                Map<String, Object> result = new HashMap<>();
                String currentPathOut = runningInsideDocker()
                    ? containerPathToWindowsPath(basePath.toAbsolutePath().toString().replace('\\', '/'))
                    : basePath.toAbsolutePath().toString();
                result.put("path", currentPathOut);
                result.put("directories", directories);
                return result;
            }
        } catch (Exception e) {
            throw new RuntimeException(
                    ApiI18nMessages.withDetail(ApiI18nMessages.BACKUP_LIST_DIR_FAILED, e.getMessage()), e);
        }
    }
    
    @Transactional
    public void persistHistory(BackupHistory history) {
        try {
            entityManager.persist(history);
            entityManager.flush();
        } catch (Exception e) {
            LOG.warnf("Erro ao persistir histórico: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw e;
        }
    }
    
    @Transactional
    public void updateHistory(BackupHistory history) {
        try {
            entityManager.merge(history);
            entityManager.flush();
        } catch (Exception e) {
            LOG.warnf("Erro ao atualizar histórico: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw e;
        }
    }

    private static boolean runningInsideDocker() {
        return Files.exists(Paths.get("/.dockerenv"));
    }

    /**
     * No Docker, localhost/LAN apontam para o container — mysqldump usa o mesmo host do JDBC quando aplicável.
     */
    private String resolveMysqldumpHost(String host) {
        if (host == null || host.isBlank()) {
            return host;
        }
        if (!runningInsideDocker()) {
            return host.trim();
        }
        String h = host.trim();
        if ("localhost".equalsIgnoreCase(h) || "127.0.0.1".equals(h)) {
            return "host.docker.internal";
        }
        if ("mysql".equalsIgnoreCase(h) || "host.docker.internal".equalsIgnoreCase(h)) {
            return h;
        }
        String jdbc = System.getenv("QUARKUS_DATASOURCE_JDBC_URL");
        if (jdbc != null && jdbc.contains("host.docker.internal")) {
            return "host.docker.internal";
        }
        return h;
    }

    private static final java.util.regex.Pattern WINDOWS_DRIVE_PATH =
        java.util.regex.Pattern.compile("(?i)^([A-Za-z]):[/\\\\]?(.*)$");

    private static boolean isWindowsStylePath(String p) {
        return p != null && WINDOWS_DRIVE_PATH.matcher(p.trim().replace('\\', '/')).matches();
    }

    /**
     * Caminho Windows escolhido pelo usuário → caminho no container (ex.: D:\Backup\BD → /mnt/win_d/Backup/BD).
     * Requer volume no docker-compose: D:/:/mnt/win_d:rw
     */
    private String windowsPathToContainerPath(String winPath) {
        if (winPath == null || winPath.isBlank()) {
            throw new RuntimeException(ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PATH_NOT_INFORMED));
        }
        String norm = winPath.trim().replace('\\', '/');
        java.util.regex.Matcher m = WINDOWS_DRIVE_PATH.matcher(norm);
        if (!m.matches()) {
            if (norm.startsWith("/")) {
                return norm;
            }
            throw new RuntimeException(
                    ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PATH_INVALID, "path", winPath));
        }
        String drive = m.group(1).toLowerCase();
        String rest = m.group(2);
        if (rest != null) {
            rest = rest.replace('\\', '/').replaceAll("^/+", "").replaceAll("/+$", "");
        } else {
            rest = "";
        }
        Path mount = Paths.get("/mnt/win_" + drive);
        if (!Files.exists(mount)) {
            throw new RuntimeException(
                    ApiI18nMessages.encode(ApiI18nMessages.BACKUP_DRIVE_NOT_MOUNTED, "drive", drive.toUpperCase()));
        }
        if (rest.isEmpty()) {
            return mount.toString().replace('\\', '/');
        }
        Path resolved = mount.resolve(rest).normalize();
        String rs = resolved.toString().replace('\\', '/');
        if (!rs.startsWith("/mnt/win_" + drive)) {
            throw new RuntimeException(
                    ApiI18nMessages.encode(ApiI18nMessages.BACKUP_PATH_OUTSIDE_DRIVE, "drive", drive.toUpperCase()));
        }
        return rs;
    }

    /** Caminho no container → caminho Windows para exibir / abrir pasta no host */
    private String containerPathToWindowsPath(String containerPath) {
        if (containerPath == null || containerPath.isBlank()) {
            return "";
        }
        String c = containerPath.replace('\\', '/');
        java.util.regex.Matcher m = java.util.regex.Pattern.compile("(?i)^/mnt/win_([a-z])(?:/(.*))?$").matcher(c);
        if (m.matches()) {
            String drive = m.group(1).toUpperCase();
            String rest = m.group(2);
            if (rest == null || rest.isEmpty()) {
                return drive + ":\\";
            }
            return drive + ":\\" + rest.replace("/", "\\");
        }
        String containerBackup = backupContainerPath != null && !backupContainerPath.isBlank()
                ? backupContainerPath.replace('\\', '/')
                : "/app/backups";
        if (c.equals(containerBackup) || c.startsWith(containerBackup + "/")) {
            String base = (backupHostExplorerFolder != null ? backupHostExplorerFolder : "./backups").trim()
                .replace('\\', '/');
            String tail = c.length() > containerBackup.length()
                ? c.substring(containerBackup.length()).replaceFirst("^/+", "") : "";
            return tail.isEmpty() ? base : base + "/" + tail;
        }
        if (c.startsWith("/app/backup")) {
            String base = (backupHostExplorerFolder != null ? backupHostExplorerFolder : "D:/Backup/BD").trim()
                .replace('/', '\\');
            String tail = c.length() > "/app/backup".length()
                ? c.substring("/app/backup".length()).replaceFirst("^/+", "") : "";
            tail = tail.replace('/', '\\');
            return tail.isEmpty() ? base : base + "\\" + tail;
        }
        return containerPath;
    }

    /**
     * Caminho da pasta de backup no Windows (para o usuário abrir no Explorer).
     * Quando o backend roda no Docker, não é possível abrir o Explorer no host via xdg-open.
     */
    private String resolveHostFolderForExplorer(String folderPath) {
        String host = System.getenv("BACKUP_HOST_EXPLORER_FOLDER");
        if (host == null || host.isBlank()) {
            host = backupHostExplorerFolder != null ? backupHostExplorerFolder.trim() : "D:/Backup/BD";
        }
        host = host.replace('/', '\\');
        if (folderPath == null || folderPath.isBlank()) {
            return host;
        }
        String fp = folderPath.replace('\\', '/');
        // Caminho malformado: /app/D:/Backup/BD
        if (fp.startsWith("/app/") && fp.length() > 5) {
            String tail = folderPath.substring(5);
            if (tail.matches("(?i)[A-Za-z]:[/\\\\].*")) {
                String w = tail.replace('/', '\\');
                int last = Math.max(w.lastIndexOf('\\'), w.lastIndexOf('/'));
                if (last > 2 && w.length() > last + 1) {
                    return w.substring(0, last);
                }
                return w;
            }
        }
        if (fp.contains("/app/backup")) {
            String relative = fp.substring(fp.indexOf("/app/backup") + "/app/backup".length());
            if (relative.startsWith("/")) {
                relative = relative.substring(1);
            }
            if (relative.isEmpty()) {
                return host;
            }
            int lastSep = Math.max(relative.lastIndexOf('/'), relative.lastIndexOf('\\'));
            if (lastSep <= 0) {
                return host;
            }
            relative = relative.substring(0, lastSep);
            return host.endsWith("\\") ? host + relative.replace('/', '\\') : host + "\\" + relative.replace('/', '\\');
        }
        if (folderPath.matches("(?i)^[A-Za-z]:[/\\\\].*")) {
            String w = folderPath.replace('/', '\\');
            int last = Math.max(w.lastIndexOf('\\'), w.lastIndexOf('/'));
            return last > 2 ? w.substring(0, last) : w;
        }
        return host;
    }

    public Map<String, Object> openFolder(String folderPath) {
        try {

            if (runningInsideDocker()) {
                String hostPath;
                if (isWindowsStylePath(folderPath)) {
                    try {
                        Path c = Paths.get(windowsPathToContainerPath(folderPath.trim()));
                        if (Files.isDirectory(c)) {
                            hostPath = containerPathToWindowsPath(c.toString().replace('\\', '/'));
                        } else {
                            Path par = c.getParent();
                            hostPath = par != null
                                ? containerPathToWindowsPath(par.toString().replace('\\', '/'))
                                : folderPath.trim().replace('/', '\\');
                        }
                    } catch (Exception ex) {
                        hostPath = folderPath.trim().replace('/', '\\');
                    }
                } else {
                    hostPath = resolveHostFolderForExplorer(folderPath);
                }
                return Map.of(
                    "success", true,
                    "openOnHost", true,
                    "hostPath", hostPath,
                    "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FOLDER_COPY_HINT)
                );
            }

            Path path = Paths.get(folderPath);
            if (!Files.exists(path)) {
                return Map.of(
                    "success", false,
                    "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FOLDER_NOT_FOUND, "path", folderPath)
                );
            }
            if (!Files.isDirectory(path)) {
                return Map.of(
                    "success", false,
                    "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FOLDER_NOT_DIR, "path", folderPath)
                );
            }

            String os = System.getProperty("os.name").toLowerCase();
            ProcessBuilder processBuilder;

            if (os.contains("win")) {
                processBuilder = new ProcessBuilder("explorer.exe", path.toAbsolutePath().toString());
            } else if (os.contains("mac")) {
                processBuilder = new ProcessBuilder("open", path.toAbsolutePath().toString());
            } else {
                Path xdg = Paths.get("/usr/bin/xdg-open");
                if (!Files.isExecutable(xdg)) {
                    xdg = Paths.get("/bin/xdg-open");
                }
                if (!Files.isExecutable(xdg)) {
                    return Map.of(
                        "success", false,
                        "message",
                                ApiI18nMessages.encode(
                                        ApiI18nMessages.BACKUP_FOLDER_OPEN_UNAVAILABLE,
                                        "path",
                                        path.toAbsolutePath().toString())
                    );
                }
                processBuilder = new ProcessBuilder(xdg.toString(), path.toAbsolutePath().toString());
            }

            processBuilder.start();

            return Map.of(
                "success", true,
                "message", ApiI18nMessages.encode(ApiI18nMessages.BACKUP_FOLDER_OPENED)
            );
        } catch (Exception e) {
            LOG.warnf("Erro ao abrir pasta: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Map.of(
                "success", false,
                "message", ApiI18nMessages.withDetail(ApiI18nMessages.BACKUP_FOLDER_OPEN_ERROR, e.getMessage())
            );
        }
    }
}

