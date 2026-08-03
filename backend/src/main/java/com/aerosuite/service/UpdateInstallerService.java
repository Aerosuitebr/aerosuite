package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.enterprise.event.Observes;
import jakarta.inject.Inject;
import io.quarkus.runtime.StartupEvent;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import com.aerosuite.i18n.I18nMessageCodec;
import com.aerosuite.i18n.SistemaAtualizacaoMessages;
import org.jboss.logging.Logger;

import java.io.*;
import java.io.PrintWriter;
import java.nio.file.*;
import java.nio.file.StandardCopyOption;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;

/**
 * Serviço para instalar atualizações de forma segura
 * Protege arquivos de configuração e permite atualização seletiva
 */
@ApplicationScoped
public class UpdateInstallerService {
    
    private static final Logger LOGGER = Logger.getLogger(UpdateInstallerService.class);
    
    // Flag para controlar cancelamento de atualizações em andamento
    private final java.util.concurrent.ConcurrentHashMap<Integer, Boolean> cancelamentoFlags = new java.util.concurrent.ConcurrentHashMap<>();
    
    @Inject
    @ConfigProperty(name = "update.install.enabled", defaultValue = "false")
    boolean installEnabled;
    
    @Inject
    @ConfigProperty(name = "update.backup.enabled", defaultValue = "true")
    boolean backupEnabled;
    
    @Inject
    @ConfigProperty(name = "update.backup.dir", defaultValue = "./backups")
    String backupDir;
    
    @Inject
    @ConfigProperty(name = "update.protected.files", defaultValue = "application.properties,application-dev.properties,application-prod.properties")
    String protectedFilesConfig;
    
    @Inject
    @ConfigProperty(name = "container.name", defaultValue = "")
    Optional<String> containerNameConfig;
    
    @Inject
    @ConfigProperty(name = "docker.host", defaultValue = "")
    Optional<String> dockerHostConfig;
    
    @Inject
    HttpUpdateService httpUpdateService;
    
    @Inject
    OneDriveService oneDriveService;
    
    @Inject
    SistemaAtualizacaoBroadcaster broadcaster;
    
    private Set<String> protectedFiles;
    
    /**
     * Lista de arquivos que NUNCA devem ser sobrescritos
     */
    private Set<String> getProtectedFiles() {
        if (protectedFiles == null) {
            protectedFiles = new HashSet<>();
            String[] files = protectedFilesConfig.split(",");
            for (String file : files) {
                protectedFiles.add(file.trim());
            }
            // Sempre proteger application.properties
            protectedFiles.add("application.properties");
            protectedFiles.add("application-dev.properties");
            protectedFiles.add("application-prod.properties");
            protectedFiles.add("application-local.properties");
        }
        return protectedFiles;
    }
    
    /**
     * Verifica se um arquivo está protegido
     */
    public boolean isProtected(String fileName) {
        return getProtectedFiles().contains(fileName) || 
               fileName.endsWith(".properties") ||
               fileName.contains("config") ||
               fileName.contains("Config");
    }
    
    /**
     * Baixa e prepara atualização para ser aplicada na próxima reinicialização
     * Como o sistema não pode substituir o próprio JAR em execução, a atualização
     * é preparada e aplicada na próxima inicialização ou via script externo
     */
    public boolean instalarAtualizacao(String version, String downloadUrl) {
        return instalarAtualizacao(version, downloadUrl, null, null);
    }
    
    /**
     * Versão sobrecarregada com suporte a broadcast de progresso
     * @param version Versão a ser instalada
     * @param downloadUrl URL de download
     * @param atualizacaoId ID da atualização para broadcast de progresso (opcional)
     * @param versaoAtual Versão atual do sistema (opcional)
     */
    /**
     * Marca uma atualização como cancelada
     */
    public void marcarComoCancelada(Integer atualizacaoId) {
        if (atualizacaoId != null) {
            cancelamentoFlags.put(atualizacaoId, true);
            LOGGER.info("Atualização " + atualizacaoId + " marcada como cancelada");
        }
    }
    
    /**
     * Verifica se uma atualização foi cancelada
     */
    private boolean foiCancelada(Integer atualizacaoId) {
        if (atualizacaoId == null) {
            return false;
        }
        return cancelamentoFlags.getOrDefault(atualizacaoId, false);
    }
    
    /**
     * Remove flag de cancelamento (quando atualização é concluída ou cancelada oficialmente)
     */
    public void limparCancelamento(Integer atualizacaoId) {
        if (atualizacaoId != null) {
            cancelamentoFlags.remove(atualizacaoId);
        }
    }
    
    /**
     * Método simplificado: apenas baixa a atualização do Google Drive
     * Cria estrutura: updates/{versao}/ na raiz do projeto
     * Não instala automaticamente - o time de suporte faz a instalação manual
     */
    public boolean baixarAtualizacao(String version, String downloadUrl, Integer atualizacaoId, String versaoAtual) {
        
        LOGGER.info("=== BAIXAR ATUALIZAÇÃO - INICIANDO ===");
        LOGGER.info("Versão: " + version);
        LOGGER.info("URL: " + downloadUrl);
        LOGGER.info("Atualização ID: " + atualizacaoId);
        LOGGER.info("Versão Atual: " + versaoAtual);
        
        // Verificar se já foi cancelada antes de iniciar
        if (atualizacaoId != null && foiCancelada(atualizacaoId)) {
            String msg = "Atualização " + atualizacaoId + " foi cancelada antes de iniciar";
            LOGGER.warn(msg);
            return false;
        }
        
        try {
            // 1. Determinar diretório raiz do projeto
            Path userDir = Paths.get(System.getProperty("user.dir"));
            LOGGER.info("Diretório de trabalho atual (user.dir): " + userDir.toAbsolutePath());
            
            // Se estamos em backend/, subir um nível para a raiz do projeto
            Path projectRoot = userDir;
            String userDirStr = userDir.toString().replace("\\", "/");
            if (userDirStr.endsWith("/backend") || userDirStr.endsWith("\\backend")) {
                projectRoot = userDir.getParent();
                LOGGER.info("Backend detectado em subdiretório. Usando raiz do projeto: " + projectRoot.toAbsolutePath());
            }
            
            // 2. Criar estrutura de pastas: updates/{versao}/
            Path updatesBaseDir = projectRoot.resolve("updates");
            Path versionDir = updatesBaseDir.resolve(version);
            
            LOGGER.info("Criando diretório base de atualizações: " + updatesBaseDir.toAbsolutePath());
            LOGGER.info("Criando diretório da versão: " + versionDir.toAbsolutePath());
            
            // Broadcast: Criando diretórios
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "EM_ANDAMENTO",
                    100,
                    I18nMessageCodec.encode(SistemaAtualizacaoMessages.CREATING_FOLDERS),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
            
            Files.createDirectories(versionDir);
            
            // Verificar se foi criado
            if (!Files.exists(versionDir)) {
                throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_VERSION_DIR_CREATE_FAILED, "path", versionDir.toAbsolutePath().toString()));
            }
            
            LOGGER.info("✓ Diretórios criados com sucesso: " + versionDir.toAbsolutePath());
            
            // 3. Baixar arquivo ZIP
            LOGGER.info("Iniciando download do arquivo ZIP para versão: " + version);
            
            // Broadcast: Iniciando download
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "EM_ANDAMENTO",
                    80,
                    I18nMessageCodec.encode(SistemaAtualizacaoMessages.DOWNLOADING_DRIVE),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
            
            // Tentar diferentes nomes de arquivo
            String[] possibleFileNames = {
                "aerosuite-fullstack-" + version + ".zip",
                "aerosuite-backend-" + version + ".zip",
                "aerosuite-" + version + ".zip"
            };
            
            String downloadedFileName = null;
            String downloadPath = null;
            boolean downloaded = false;
            
            if (httpUpdateService != null && httpUpdateService.isEnabled()) {
                // Verificar se a URL de download já aponta para um arquivo específico
                String downloadUrlFromService = httpUpdateService.getDownloadUrl(version);
                LOGGER.info("URL retornada por getDownloadUrl: " + downloadUrlFromService);
                
                for (String fileName : possibleFileNames) {
                    downloadPath = versionDir.resolve(fileName).toString();
                    LOGGER.info("Tentando baixar: " + fileName + " para " + downloadPath);
                    
                    downloaded = httpUpdateService.baixarArquivo(fileName, downloadPath);
                    
                    if (downloaded && Files.exists(Paths.get(downloadPath))) {
                        downloadedFileName = fileName;
                        LOGGER.info("✓ Download concluído: " + fileName + " em " + downloadPath);
                        break;
                    }
                }
            }
            
            if (!downloaded || downloadedFileName == null) {
                String erro = ApiI18nMessages.encode(ApiI18nMessages.UPDATE_ZIP_NOT_FOUND);
                LOGGER.warnf("❌ %s", erro);
                LOGGER.error(erro);
                throw new RuntimeException(erro);
            }
            
            // 4. Criar arquivo de informação sobre a atualização
            Path infoFile = versionDir.resolve("INFO.txt");
            try (BufferedWriter writer = Files.newBufferedWriter(infoFile)) {
                writer.write("=== INFORMAÇÃO DA ATUALIZAÇÃO ===");
                writer.newLine();
                writer.write("Versão: " + version);
                writer.newLine();
                writer.write("Versão Atual do Sistema: " + (versaoAtual != null ? versaoAtual : "Desconhecida"));
                writer.newLine();
                writer.write("Arquivo Baixado: " + downloadedFileName);
                writer.newLine();
                writer.write("Data/Hora do Download: " + java.time.LocalDateTime.now());
                writer.newLine();
                writer.write("Status: PRONTA PARA INSTALAÇÃO");
                writer.newLine();
                writer.newLine();
                writer.write("=== INSTRUÇÕES ===");
                writer.newLine();
                writer.write("O arquivo de atualização foi baixado com sucesso.");
                writer.newLine();
                writer.write("O time de suporte pode proceder com a instalação manual.");
                writer.newLine();
                writer.write("Localização: " + downloadPath);
                writer.newLine();
            }
            
            
            LOGGER.info("=== ATUALIZAÇÃO BAIXADA COM SUCESSO ===");
            LOGGER.info("Versão: " + version);
            LOGGER.info("Arquivo: " + downloadedFileName);
            LOGGER.info("Localização: " + downloadPath);
            
            // Broadcast: Download concluído
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "PRONTA_PARA_INSTALACAO",
                    0,
                    I18nMessageCodec.encode(SistemaAtualizacaoMessages.DOWNLOAD_READY_SUPPORT),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
            
            return true;
            
        } catch (Exception e) {
            String erro = ApiI18nMessages.withDetail(ApiI18nMessages.UPDATE_DOWNLOAD_ERROR, e.getMessage());
            LOGGER.warnf("❌ %s", erro);
            LOGGER.error(erro, e);
            LOGGER.warnf(e, "Erro inesperado");
            return false;
        }
    }
    
    /**
     * Método antigo mantido para compatibilidade - agora apenas chama baixarAtualizacao
     * @deprecated Use baixarAtualizacao() diretamente
     */
    @Deprecated
    public boolean instalarAtualizacao(String version, String downloadUrl, Integer atualizacaoId, String versaoAtual) {
        // Apenas baixar, não instalar automaticamente
        return baixarAtualizacao(version, downloadUrl, atualizacaoId, versaoAtual);
    }
    
    /**
     * Encontra o diretório do frontend dentro do ZIP extraído
     */
    private Path encontrarFrontendExtraido(Path extractDir) throws IOException {
        // Procurar por padrões comuns de frontend
        String[] patterns = {
            "frontend",
            "dist",
            "frontend/dist",
            "web",
            "frontend/dist/aerosuite-frontend"
        };
        
        for (String pattern : patterns) {
            try {
                Path found = Files.walk(extractDir)
                    .filter(p -> {
                        String relativePath = extractDir.relativize(p).toString();
                        return relativePath.equals(pattern) || 
                               relativePath.startsWith(pattern + "/") ||
                               (p.getFileName() != null && p.getFileName().toString().equals("dist"));
                    })
                    .filter(Files::isDirectory)
                    .findFirst()
                    .orElse(null);
                
                if (found != null && Files.exists(found)) {
                    // Verificar se tem arquivos HTML (confirma que é frontend)
                    boolean hasHtml = Files.walk(found)
                        .anyMatch(p -> p.toString().endsWith(".html") || p.toString().endsWith("index.html"));
                    
                    if (hasHtml) {
                        return found;
                    }
                }
            } catch (Exception e) {
                // Continuar procurando
            }
        }
        
        return null;
    }
    
    /**
     * Encontra o JAR dentro do diretório extraído do ZIP
     */
    private Path encontrarJarExtraido(Path extractDir, String version) throws IOException {
        // Procurar por padrões comuns
        String[] patterns = {
            "aerosuite-backend-" + version + ".jar",
            "backend/aerosuite-backend-" + version + ".jar"
        };
        
        for (String pattern : patterns) {
            try {
                Path found = Files.walk(extractDir)
                    .filter(p -> {
                        String fileName = p.getFileName().toString();
                        return fileName.equals(pattern) || 
                               fileName.equals("aerosuite-backend-" + version + ".jar") ||
                               (fileName.startsWith("aerosuite-backend-") && fileName.endsWith(".jar"));
                    })
                    .filter(p -> p.toString().endsWith(".jar"))
                    .findFirst()
                    .orElse(null);
                
                if (found != null && Files.exists(found)) {
                    return found;
                }
            } catch (Exception e) {
                // Continuar procurando
            }
        }
        
        return null;
    }
    
    /**
     * Cria scripts para aplicar a atualização (Windows e Linux)
     */
    private void criarScriptsAtualizacao(String version, String downloadPath, boolean isZip, boolean hasFrontend) throws IOException {
        Path updatesDir = Paths.get(System.getProperty("user.dir"), "updates");
        
        // Script Windows (.bat)
        Path batScript = updatesDir.resolve("apply-update.bat");
        try (BufferedWriter writer = Files.newBufferedWriter(batScript)) {
            writer.write("@echo off");
            writer.newLine();
            writer.write("echo ========================================");
            writer.newLine();
            writer.write("echo APLICANDO ATUALIZACAO DO SISTEMA");
            writer.newLine();
            writer.write("echo ========================================");
            writer.newLine();
            writer.newLine();
            writer.write("set VERSION=" + version);
            writer.newLine();
            writer.write("set UPDATE_FILE=" + Paths.get(downloadPath).getFileName().toString());
            writer.newLine();
            writer.newLine();
            writer.write("echo Parando o sistema...");
            writer.newLine();
            writer.write("REM Adicione aqui o comando para parar o sistema (ex: net stop Aero SuiteService)");
            writer.newLine();
            writer.newLine();
            writer.write("echo Aplicando atualizacao...");
            writer.newLine();
            writer.write("copy /Y \"pending\\%UPDATE_FILE%\" \"..\\target\\aerosuite-backend-%VERSION%.jar\"");
            writer.newLine();
            writer.newLine();
            writer.write("echo Removendo flag de atualizacao pendente...");
            writer.newLine();
            writer.write("del /Q \"pending\\update-pending.flag\"");
            writer.newLine();
            writer.write("del /Q \"pending\\%UPDATE_FILE%\"");
            writer.newLine();
            writer.newLine();
            writer.write("echo ========================================");
            writer.newLine();
            writer.write("echo ATUALIZACAO APLICADA COM SUCESSO!");
            writer.newLine();
            writer.write("echo Reinicie o sistema manualmente.");
            writer.newLine();
            writer.write("echo ========================================");
            writer.newLine();
            writer.write("pause");
        }
        
        // Script Linux (.sh)
        Path shScript = updatesDir.resolve("apply-update.sh");
        try (BufferedWriter writer = Files.newBufferedWriter(shScript)) {
            writer.write("#!/bin/bash");
            writer.newLine();
            writer.write("echo '========================================'");
            writer.newLine();
            writer.write("echo 'APLICANDO ATUALIZACAO DO SISTEMA'");
            writer.newLine();
            writer.write("echo '========================================'");
            writer.newLine();
            writer.newLine();
            writer.write("VERSION=\"" + version + "\"");
            writer.newLine();
            writer.write("UPDATE_FILE=\"" + Paths.get(downloadPath).getFileName().toString() + "\"");
            writer.newLine();
            writer.newLine();
            writer.write("echo 'Parando o sistema...'");
            writer.newLine();
            writer.write("# Adicione aqui o comando para parar o sistema (ex: systemctl stop aerosuite)");
            writer.newLine();
            writer.newLine();
            writer.write("echo 'Aplicando atualizacao do backend...'");
            writer.newLine();
            writer.write("cp \"pending/$UPDATE_FILE\" \"../target/aerosuite-backend-$VERSION.jar\"");
            writer.newLine();
            writer.newLine();
            
            if (hasFrontend) {
                writer.write("echo 'Aplicando atualizacao do frontend...'");
                writer.newLine();
                writer.write("# Frontend sera atualizado via Docker volume ou copiado para diretorio do nginx");
                writer.newLine();
                writer.write("# Se o frontend estiver em um ZIP separado ou no fullstack ZIP:");
                writer.newLine();
                writer.write("# 1. Extrair arquivos do frontend");
                writer.newLine();
                writer.write("# 2. Copiar para volume do Docker ou diretorio do nginx");
                writer.newLine();
                writer.write("# 3. Reiniciar container do frontend: docker restart aerosuite-frontend");
                writer.newLine();
            }
            
            writer.newLine();
            writer.write("echo 'Removendo flag de atualizacao pendente...'");
            writer.newLine();
            writer.write("rm -f \"pending/update-pending.flag\"");
            writer.newLine();
            writer.write("rm -f \"pending/$UPDATE_FILE\"");
            writer.newLine();
            writer.newLine();
            writer.write("echo '========================================'");
            writer.newLine();
            writer.write("echo 'ATUALIZACAO APLICADA COM SUCESSO!'");
            writer.newLine();
            writer.write("echo 'Reinicie o sistema manualmente.'");
            writer.newLine();
            writer.write("echo '========================================'");
        }
        
        // Tornar script Linux executável
        try {
            batScript.toFile().setExecutable(true);
            shScript.toFile().setExecutable(true);
        } catch (Exception e) {
            LOGGER.warn("Não foi possível tornar scripts executáveis: " + e.getMessage());
        }
    }
    
    /**
     * Verifica se há atualização pendente e aplica na inicialização
     * Este método deve ser chamado no início da aplicação
     */
    public boolean verificarEAplicarAtualizacaoPendente() {
        try {
            Path flagFile = Paths.get(System.getProperty("user.dir"), "updates", "pending", "update-pending.flag");
            
            if (!Files.exists(flagFile)) {
                return false; // Nenhuma atualização pendente
            }
            
            LOGGER.info("=== ATUALIZAÇÃO PENDENTE DETECTADA ===");
            
            // Ler informações da atualização pendente
            String version = null;
            String fileName = null;
            String filePathRelative = null;
            String filePathAbsolute = null;
            
            try (BufferedReader reader = Files.newBufferedReader(flagFile)) {
                String line;
                while ((line = reader.readLine()) != null) {
                    if (line.startsWith("version=")) {
                        version = line.substring("version=".length());
                    } else if (line.startsWith("file=")) {
                        fileName = line.substring("file=".length());
                    } else if (line.startsWith("filePath=")) {
                        filePathRelative = line.substring("filePath=".length());
                    } else if (line.startsWith("filePathAbsolute=")) {
                        filePathAbsolute = line.substring("filePathAbsolute=".length());
                    }
                }
            }
            
            if (version == null || fileName == null) {
                LOGGER.error("Arquivo de flag de atualização inválido");
                return false;
            }
            
            LOGGER.info("Aplicando atualização pendente: versão " + version);
            LOGGER.info("Nome do arquivo: " + fileName);
            if (filePathRelative != null) {
                LOGGER.info("Caminho relativo: " + filePathRelative);
            }
            if (filePathAbsolute != null) {
                LOGGER.info("Caminho absoluto: " + filePathAbsolute);
            }
            
            // Tentar encontrar o arquivo em diferentes locais
            Path updateFile = null;
            
            // 1. Tentar caminho absoluto primeiro (mais confiável)
            if (filePathAbsolute != null && !filePathAbsolute.isEmpty()) {
                Path absolutePath = Paths.get(filePathAbsolute);
                if (Files.exists(absolutePath)) {
                    updateFile = absolutePath;
                    LOGGER.info("Arquivo encontrado usando caminho absoluto: " + updateFile);
                }
            }
            
            // 2. Tentar caminho relativo ao diretório de updates
            if (updateFile == null && filePathRelative != null && !filePathRelative.isEmpty()) {
                Path updatesDir = Paths.get(System.getProperty("user.dir"), "updates", "pending");
                Path relativePath = updatesDir.resolve(filePathRelative.replace("/", File.separator)).normalize();
                if (Files.exists(relativePath)) {
                    updateFile = relativePath;
                    LOGGER.info("Arquivo encontrado usando caminho relativo: " + updateFile);
                }
            }
            
            // 3. Tentar no diretório raiz de updates/pending (compatibilidade com versões antigas)
            if (updateFile == null) {
                Path updatesDir = Paths.get(System.getProperty("user.dir"), "updates", "pending");
                Path simplePath = updatesDir.resolve(fileName);
                if (Files.exists(simplePath)) {
                    updateFile = simplePath;
                    LOGGER.info("Arquivo encontrado no diretório raiz: " + updateFile);
                }
            }
            
            // 4. Procurar recursivamente em subdiretórios (caso tenha sido extraído)
            if (updateFile == null) {
                Path updatesDir = Paths.get(System.getProperty("user.dir"), "updates", "pending");
                final String finalFileName = fileName; // Variável final para uso em lambda
                try {
                    updateFile = Files.walk(updatesDir)
                        .filter(p -> p.getFileName() != null && p.getFileName().toString().equals(finalFileName))
                        .filter(Files::isRegularFile)
                        .findFirst()
                        .orElse(null);
                    
                    if (updateFile != null) {
                        LOGGER.info("Arquivo encontrado em busca recursiva: " + updateFile);
                    }
                } catch (IOException e) {
                    LOGGER.warn("Erro ao buscar arquivo recursivamente: " + e.getMessage());
                }
            }
            
            if (updateFile == null || !Files.exists(updateFile)) {
                LOGGER.error("Arquivo de atualização não encontrado em nenhum local:");
                LOGGER.error("  - Nome do arquivo: " + fileName);
                if (filePathRelative != null) {
                    LOGGER.error("  - Caminho relativo tentado: " + filePathRelative);
                }
                if (filePathAbsolute != null) {
                    LOGGER.error("  - Caminho absoluto tentado: " + filePathAbsolute);
                }
                LOGGER.error("  - Diretório de busca: " + Paths.get(System.getProperty("user.dir"), "updates", "pending"));
                return false;
            }
            
            Path targetJar = Paths.get(System.getProperty("user.dir"), "target", "aerosuite-backend-" + version + ".jar");
            
            // Criar diretório target se não existir
            Files.createDirectories(targetJar.getParent());
            
            // Copiar novo JAR para o local do JAR antigo
            Files.copy(updateFile, targetJar, StandardCopyOption.REPLACE_EXISTING);
            
            // Remover flag e arquivo temporário
            Files.deleteIfExists(flagFile);
            Files.deleteIfExists(updateFile);
            
            LOGGER.info("=== ATUALIZAÇÃO APLICADA COM SUCESSO ===");
            LOGGER.info("Nova versão: " + version);
            LOGGER.info("Reinicie o sistema para usar a nova versão.");
            
            return true;
            
        } catch (Exception e) {
            LOGGER.error("Erro ao aplicar atualização pendente: " + e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Cria backup dos arquivos antes de atualizar
     * @param version Versão que será instalada
     * @param atualizacaoId ID da atualização para broadcast de progresso (opcional)
     * @param versaoAtual Versão atual do sistema (opcional)
     */
    private void criarBackup(String version) {
        criarBackup(version, null, null);
    }
    
    /**
     * Versão sobrecarregada com suporte a broadcast de progresso
     */
    private void criarBackup(String version, Integer atualizacaoId, String versaoAtual) {
        final Path[] backupPathRef = new Path[1]; // Array para permitir uso em lambda
        try {
            // Resolver diretório de backup (absoluto ou relativo ao user.dir)
            // Se o backend roda de backend/, garantir que backups sejam criados no diretório raiz do projeto
            Path backupDirPath;
            if (backupDir.startsWith("/") || backupDir.matches("^[A-Za-z]:.*")) {
                // Caminho absoluto (Unix/Linux ou Windows)
                backupDirPath = Paths.get(backupDir);
            } else {
                // Caminho relativo ao diretório de trabalho
                Path userDir = Paths.get(System.getProperty("user.dir"));
                Path resolvedPath = userDir.resolve(backupDir).normalize();
                
                // Se estamos em backend/ e o caminho resolve para backend/backups ou similar,
                // tentar criar no diretório raiz do projeto (subir um nível)
                String userDirStr = userDir.toString().replace("\\", "/");
                if (userDirStr.endsWith("/backend") || userDirStr.endsWith("\\backend")) {
                    // Estamos em backend/, garantir que backups sejam criados no diretório raiz
                    Path projectRoot = userDir.getParent();
                    if (projectRoot != null) {
                        // Se backupDir é relativo e começa com ../, já está correto
                        // Caso contrário, criar em projectRoot/backups
                        if (backupDir.startsWith("../")) {
                            backupDirPath = resolvedPath;
                        } else {
                            backupDirPath = projectRoot.resolve("backups").normalize();
                            LOGGER.info("Backend detectado em subdiretório. Criando backup no diretório raiz do projeto: " + backupDirPath.toAbsolutePath());
                        }
                    } else {
                        backupDirPath = resolvedPath;
                    }
                } else {
                    backupDirPath = resolvedPath;
                }
            }
            
            LOGGER.info("=== INICIANDO BACKUP DO SISTEMA ===");
            LOGGER.info("Diretório base de backup configurado: " + backupDir);
            LOGGER.info("Diretório base de backup resolvido: " + backupDirPath.toAbsolutePath());
            LOGGER.info("Backup habilitado: " + backupEnabled);
            
            // Criar diretório base de backup se não existir
            LOGGER.info("Criando diretório base de backup: " + backupDirPath.toAbsolutePath());
            Files.createDirectories(backupDirPath);
            
            // Verificar se foi criado
            if (!Files.exists(backupDirPath)) {
                String erro = "Falha ao criar diretório base de backup: " + backupDirPath.toAbsolutePath();
                LOGGER.warnf("❌ %s", erro);
                LOGGER.error(erro);
                throw new IOException(erro);
            }
            LOGGER.info("✓ Diretório base de backup criado: " + backupDirPath.toAbsolutePath());
            
            // Verificar permissões de escrita
            if (!Files.isWritable(backupDirPath)) {
                throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.UPDATE_BACKUP_DIR_NOT_WRITABLE, "path", backupDirPath.toAbsolutePath().toString()));
            }
            
            String timestamp = String.valueOf(System.currentTimeMillis());
            Path backupPath = backupDirPath.resolve("backup-" + version + "-" + timestamp);
            backupPathRef[0] = backupPath; // Armazenar referência
            
            LOGGER.info("Criando diretório de backup específico: " + backupPath.toAbsolutePath());
            Files.createDirectories(backupPath);
            
            // Verificar se o diretório foi criado
            if (!Files.exists(backupPath)) {
                String erro = "Falha ao criar diretório de backup: " + backupPath.toAbsolutePath();
                LOGGER.warnf("❌ %s", erro);
                LOGGER.error(erro);
                throw new IOException(erro);
            }
            
            LOGGER.info("✓ Diretório de backup criado com sucesso: " + backupPath.toAbsolutePath());
            LOGGER.info("✓ Backup habilitado: " + backupEnabled);
            
            Path userDir = Paths.get(System.getProperty("user.dir"));
            LOGGER.info("Diretório de trabalho: " + userDir.toAbsolutePath());
            
            java.util.concurrent.atomic.AtomicInteger copiedFiles = new java.util.concurrent.atomic.AtomicInteger(0);
            
            // 1. Copiar JAR atual do sistema (backend)
            LOGGER.info("📦 Passo 1: Fazendo backup do backend (arquivo JAR)...");
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "EM_ANDAMENTO",
                    285,
                    I18nMessageCodec.encode(SistemaAtualizacaoMessages.BACKUP_JAR),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
            
            Path targetDir = userDir.resolve("target");
            LOGGER.info("Procurando JARs em: " + targetDir.toAbsolutePath());
            final Path finalBackupPath = backupPath; // Variável final para uso em lambda
            if (Files.exists(targetDir)) {
                try {
                    Files.walk(targetDir)
                        .filter(p -> p.toString().endsWith(".jar") && 
                                   (p.getFileName().toString().startsWith("aerosuite-backend-") || 
                                    p.getFileName().toString().contains("aerosuite")))
                        .forEach(jarFile -> {
                            try {
                                Path relativePath = targetDir.relativize(jarFile);
                                Path backupJarPath = finalBackupPath.resolve("target").resolve(relativePath);
                                Files.createDirectories(backupJarPath.getParent());
                                Files.copy(jarFile, backupJarPath, StandardCopyOption.REPLACE_EXISTING);
                                LOGGER.info("JAR copiado: " + jarFile.getFileName());
                                copiedFiles.incrementAndGet();
                            } catch (Exception e) {
                                LOGGER.warn("Erro ao copiar JAR " + jarFile + ": " + e.getMessage());
                            }
                        });
                } catch (Exception e) {
                    LOGGER.warn("Erro ao processar diretório target: " + e.getMessage());
                }
            }
            
            // 2. Copiar arquivos de configuração
            LOGGER.info("📄 Passo 2: Fazendo backup dos arquivos de configuração...");
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "EM_ANDAMENTO",
                    282,
                    I18nMessageCodec.encode(SistemaAtualizacaoMessages.BACKUP_CONFIG),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
            
            Path configDir = backupPath.resolve("config");
            LOGGER.info("Criando diretório de backup de configuração: " + configDir.toAbsolutePath());
            Files.createDirectories(configDir);
            
            // Verificar se foi criado
            if (!Files.exists(configDir)) {
                String erro = "Falha ao criar diretório de backup de configuração: " + configDir.toAbsolutePath();
                LOGGER.warnf("❌ %s", erro);
                LOGGER.error(erro);
                throw new IOException(erro);
            }
            LOGGER.info("✓ Diretório de configuração criado: " + configDir.toAbsolutePath());
            
            // Copiar application.properties e variações
            String[] configFiles = {
                "application.properties",
                "application-dev.properties",
                "application-prod.properties",
                "application-local.properties",
                "application.yml",
                "application.yaml"
            };
            
            for (String configFile : configFiles) {
                Path configPath = userDir.resolve("src").resolve("main").resolve("resources").resolve(configFile);
                if (!Files.exists(configPath)) {
                    // Tentar no diretório raiz também
                    configPath = userDir.resolve(configFile);
                }
                
                if (Files.exists(configPath)) {
                    try {
                        Path backupConfigPath = configDir.resolve(configFile);
                        Files.copy(configPath, backupConfigPath, StandardCopyOption.REPLACE_EXISTING);
                        LOGGER.info("Configuração copiada: " + configFile);
                        copiedFiles.incrementAndGet();
                    } catch (Exception e) {
                        LOGGER.warn("Erro ao copiar configuração " + configFile + ": " + e.getMessage());
                    }
                }
            }
            
            // 3. Copiar diretório de recursos completo (se existir)
            Path resourcesDir = userDir.resolve("src").resolve("main").resolve("resources");
            if (Files.exists(resourcesDir)) {
                try {
                    Path backupResourcesDir = backupPath.resolve("resources");
                    copiarDiretorio(resourcesDir, backupResourcesDir);
                    LOGGER.info("Diretório de recursos copiado");
                } catch (Exception e) {
                    LOGGER.warn("Erro ao copiar diretório de recursos: " + e.getMessage());
                }
            }
            
            // 4. Copiar arquivos do frontend (se existir)
            LOGGER.info("🌐 Passo 4: Fazendo backup do frontend...");
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "EM_ANDAMENTO",
                    279,
                    I18nMessageCodec.encode(SistemaAtualizacaoMessages.BACKUP_FRONTEND),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
            
            // Tentar encontrar o diretório do frontend (pode estar no diretório pai do backend)
            final Path[] frontendDirRef = new Path[1]; // Array para permitir uso em escopo mais amplo
            Path projectRoot = userDir.getParent(); // Diretório raiz do projeto
            
            // Verificar se o frontend está no diretório raiz do projeto
            if (projectRoot != null) {
                Path possibleFrontendDir = projectRoot.resolve("frontend");
                if (Files.exists(possibleFrontendDir) && Files.isDirectory(possibleFrontendDir)) {
                    frontendDirRef[0] = possibleFrontendDir;
                    LOGGER.info("Frontend encontrado em: " + possibleFrontendDir.toAbsolutePath());
                }
            }
            
            // Se não encontrou no diretório pai, tentar no mesmo nível do backend
            if (frontendDirRef[0] == null) {
                Path possibleFrontendDir = userDir.resolve("..").resolve("frontend").normalize();
                if (Files.exists(possibleFrontendDir) && Files.isDirectory(possibleFrontendDir)) {
                    frontendDirRef[0] = possibleFrontendDir;
                    LOGGER.info("Frontend encontrado em: " + possibleFrontendDir.toAbsolutePath());
                }
            }
            
            if (frontendDirRef[0] != null && Files.exists(frontendDirRef[0])) {
                try {
                    Path backupFrontendDir = backupPath.resolve("frontend");
                    LOGGER.info("Copiando frontend de " + frontendDirRef[0].toAbsolutePath() + " para " + backupFrontendDir.toAbsolutePath());
                    
                    // Copiar diretório dist/ (arquivos compilados) - mais importante
                    Path frontendDist = frontendDirRef[0].resolve("dist");
                    if (Files.exists(frontendDist)) {
                        Path backupFrontendDist = backupFrontendDir.resolve("dist");
                        copiarDiretorio(frontendDist, backupFrontendDist);
                        LOGGER.info("✓ Diretório dist/ do frontend copiado");
                        copiedFiles.incrementAndGet();
                    }
                    
                    // Copiar arquivos importantes de configuração do frontend
                    String[] frontendConfigFiles = {
                        "package.json",
                        "package-lock.json",
                        "angular.json",
                        "tsconfig.json",
                        "nginx.conf",
                        "Dockerfile",
                        "proxy.conf.json"
                    };
                    
                    for (String configFile : frontendConfigFiles) {
                        Path configPath = frontendDirRef[0].resolve(configFile);
                        if (Files.exists(configPath)) {
                            try {
                                Path backupConfigPath = backupFrontendDir.resolve(configFile);
                                Files.createDirectories(backupConfigPath.getParent());
                                Files.copy(configPath, backupConfigPath, StandardCopyOption.REPLACE_EXISTING);
                                LOGGER.info("Arquivo de configuração do frontend copiado: " + configFile);
                                copiedFiles.incrementAndGet();
                            } catch (Exception e) {
                                LOGGER.warn("Erro ao copiar arquivo de configuração do frontend " + configFile + ": " + e.getMessage());
                            }
                        }
                    }
                    
                    LOGGER.info("✓ Backup do frontend concluído");
                } catch (Exception e) {
                    LOGGER.warnf("⚠️  Erro ao copiar frontend: %s", e.getMessage());
                    LOGGER.warn("Erro ao copiar frontend: " + e.getMessage(), e);
                }
            } else {
                LOGGER.info("Frontend não encontrado. O backup do frontend será pulado.");
            }
            
            // 5. Criar arquivo de metadados do backup
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "EM_ANDAMENTO",
                    280,
                    I18nMessageCodec.encode(SistemaAtualizacaoMessages.FINISHING_BACKUP),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
            
            Path metadataFile = backupPath.resolve("backup-metadata.txt");
            boolean frontendBackedUp = Files.exists(backupPath.resolve("frontend"));
            try (BufferedWriter writer = Files.newBufferedWriter(metadataFile)) {
                writer.write("=== METADADOS DO BACKUP ===");
                writer.newLine();
                writer.write("Data/Hora: " + java.time.LocalDateTime.now());
                writer.newLine();
                writer.write("Versão Atual: " + (versaoAtual != null ? versaoAtual : "Desconhecida"));
                writer.newLine();
                writer.write("Versão que será instalada: " + version);
                writer.newLine();
                writer.write("Timestamp: " + timestamp);
                writer.newLine();
                writer.write("Diretório de trabalho: " + userDir.toAbsolutePath());
                writer.newLine();
                writer.write("Arquivos copiados: " + copiedFiles.get());
                writer.newLine();
                writer.write("Frontend incluído no backup: " + (frontendBackedUp ? "Sim" : "Não"));
                if (frontendDirRef[0] != null) {
                    writer.newLine();
                    writer.write("Diretório do frontend: " + frontendDirRef[0].toAbsolutePath());
                }
                writer.newLine();
                writer.write("Sistema Operacional: " + System.getProperty("os.name") + " " + System.getProperty("os.version"));
                writer.newLine();
                writer.write("Java Version: " + System.getProperty("java.version"));
                writer.newLine();
            }
            
            
            LOGGER.info("=== BACKUP CONCLUÍDO COM SUCESSO ===");
            LOGGER.info("Localização: " + backupPath.toAbsolutePath());
            LOGGER.info("Arquivos copiados: " + copiedFiles.get());
            LOGGER.info("Metadados salvos em: " + metadataFile.getFileName());
            
            // Verificar se pelo menos alguns arquivos foram copiados
            if (copiedFiles.get() == 0) {
                LOGGER.warnf("⚠️  ATENÇÃO: Nenhum arquivo foi copiado no backup!");
                LOGGER.warnf("Verifique se os diretórios target/ e src/main/resources/ existem.");
                LOGGER.warn("⚠️  ATENÇÃO: Nenhum arquivo foi copiado no backup!");
                LOGGER.warn("Verifique se os diretórios target/ e src/main/resources/ existem.");
            } else {
                LOGGER.info("✅ Backup criado com sucesso! " + copiedFiles.get() + " arquivo(s) copiado(s).");
            }
            
            // Broadcast: Backup concluído
            LOGGER.info("📢 Enviando broadcast: Backup concluído");
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "EM_ANDAMENTO",
                    270, // Continuar contador
                    I18nMessageCodec.encode(
                            SistemaAtualizacaoMessages.BACKUP_DONE_DOWNLOAD,
                            "count",
                            String.valueOf(copiedFiles.get())),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
            
        } catch (Exception e) {
            LOGGER.error("❌ ERRO CRÍTICO ao criar backup: " + e.getMessage(), e);
            LOGGER.error("Stack trace completo:", e);
            LOGGER.warnf(e, "Erro inesperado");
            
            // Tentar criar pelo menos um arquivo de erro no diretório de backup
            try {
                Path backupDirPath;
                if (backupDir.startsWith("/") || backupDir.matches("^[A-Za-z]:.*")) {
                    backupDirPath = Paths.get(backupDir);
                } else {
                    Path userDir = Paths.get(System.getProperty("user.dir"));
                    Path resolvedPath = userDir.resolve(backupDir).normalize();
                    
                    // Se estamos em backend/ e o caminho resolve para backend/backups ou similar,
                    // tentar criar no diretório raiz do projeto (subir um nível)
                    String userDirStr = userDir.toString().replace("\\", "/");
                    if (userDirStr.endsWith("/backend") || userDirStr.endsWith("\\backend")) {
                        // Estamos em backend/, garantir que backups sejam criados no diretório raiz
                        Path projectRoot = userDir.getParent();
                        if (projectRoot != null) {
                            // Se backupDir é relativo e começa com ../, já está correto
                            // Caso contrário, criar em projectRoot/backups
                            if (backupDir.startsWith("../")) {
                                backupDirPath = resolvedPath;
                            } else {
                                backupDirPath = projectRoot.resolve("backups").normalize();
                            }
                        } else {
                            backupDirPath = resolvedPath;
                        }
                    } else {
                        backupDirPath = resolvedPath;
                    }
                }
                
                Files.createDirectories(backupDirPath);
                
                Path errorFile = backupDirPath.resolve("backup-error-" + System.currentTimeMillis() + ".txt");
                try (BufferedWriter writer = Files.newBufferedWriter(errorFile)) {
                    writer.write("ERRO AO CRIAR BACKUP");
                    writer.newLine();
                    writer.write("Data/Hora: " + java.time.LocalDateTime.now());
                    writer.newLine();
                    writer.write("Erro: " + e.getMessage());
                    writer.newLine();
                    writer.write("Versão: " + version);
                    writer.newLine();
                    writer.write("Diretório de backup configurado: " + backupDir);
                    writer.newLine();
                    writer.write("Diretório resolvido: " + backupDirPath.toAbsolutePath());
                    writer.newLine();
                    writer.write("Stack trace:");
                    writer.newLine();
                    StringWriter sw = new StringWriter();
                    PrintWriter pw = new PrintWriter(sw);
                    e.printStackTrace(pw);
                    writer.write(sw.toString());
                }
                LOGGER.info("Arquivo de erro criado: " + errorFile.toAbsolutePath());
            } catch (Exception e2) {
                LOGGER.error("Não foi possível criar arquivo de erro: " + e2.getMessage());
            }
            
            // NÃO lançar exceção - permitir que a atualização continue mesmo se o backup falhar
            // Mas logar o erro claramente
            LOGGER.warn("⚠️  ATENÇÃO: Backup falhou, mas a atualização continuará.");
            LOGGER.warn("Recomenda-se fazer backup manual antes de continuar!");
            
            // Broadcast: Erro no backup
            if (atualizacaoId != null && broadcaster != null) {
                broadcaster.broadcast(new SistemaAtualizacaoBroadcaster.AtualizacaoProgress(
                    atualizacaoId.toString(),
                    "EM_ANDAMENTO",
                    270, // Continuar mesmo com erro
                    I18nMessageCodec.encode(
                            SistemaAtualizacaoMessages.BACKUP_FAILED_CONTINUE,
                            "error",
                            e.getMessage() != null ? e.getMessage() : ""),
                    version,
                    versaoAtual != null ? versaoAtual : "1.0.0",
                    null
                ));
            }
        }
    }
    
    /**
     * Copia um diretório recursivamente
     */
    private void copiarDiretorio(Path origem, Path destino) throws IOException {
        Files.walk(origem).forEach(source -> {
            try {
                Path target = destino.resolve(origem.relativize(source));
                if (Files.isDirectory(source)) {
                    Files.createDirectories(target);
                } else {
                    // Não copiar arquivos muito grandes (> 100MB)
                    if (Files.size(source) < 100 * 1024 * 1024) {
                        Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
                    } else {
                        LOGGER.warn("Arquivo muito grande ignorado no backup: " + source);
                    }
                }
            } catch (IOException e) {
                LOGGER.warn("Erro ao copiar arquivo " + source + ": " + e.getMessage());
            }
        });
    }
    
    /**
     * Extrai arquivos do ZIP, mas protege arquivos de configuração
     */
    private boolean extrairArquivosSeletivos(String zipPath, String extractTo) {
        try {
            Path extractPath = Paths.get(extractTo);
            int filesExtracted = 0;
            int filesSkipped = 0;
            
            try (ZipInputStream zis = new ZipInputStream(new FileInputStream(zipPath))) {
                ZipEntry entry;
                
                while ((entry = zis.getNextEntry()) != null) {
                    String fileName = entry.getName();
                    
                    // Pular arquivos protegidos
                    if (isProtected(fileName)) {
                        LOGGER.info("Protegendo arquivo: " + fileName);
                        filesSkipped++;
                        continue;
                    }
                    
                    // Pular diretórios
                    if (entry.isDirectory()) {
                        continue;
                    }
                    
                    // Extrair apenas arquivos permitidos
                    Path filePath = extractPath.resolve(fileName);
                    
                    // Criar diretórios necessários
                    Files.createDirectories(filePath.getParent());
                    
                    // Extrair arquivo
                    try (FileOutputStream fos = new FileOutputStream(filePath.toFile())) {
                        byte[] buffer = new byte[8192];
                        int len;
                        while ((len = zis.read(buffer)) > 0) {
                            fos.write(buffer, 0, len);
                        }
                    }
                    
                    filesExtracted++;
                    LOGGER.info("Arquivo extraído: " + fileName);
                }
            }
            
            LOGGER.info("Extração concluída: " + filesExtracted + " arquivos extraídos, " + filesSkipped + " protegidos");
            return true;
            
        } catch (Exception e) {
            LOGGER.error("Erro ao extrair arquivos: " + e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Verifica quais arquivos seriam atualizados sem realmente atualizar
     */
    public List<String> previewAtualizacao(String version, String downloadUrl) {
        List<String> filesToUpdate = new ArrayList<>();
        
        try {
            String tempDir = System.getProperty("java.io.tmpdir");
            String downloadPath = tempDir + File.separator + "preview-" + version + ".zip";
            
            // Baixar temporariamente
            boolean downloaded = false;
            if (httpUpdateService != null && httpUpdateService.isEnabled()) {
                downloaded = httpUpdateService.baixarArquivo("aerosuite-" + version + ".zip", downloadPath);
            }
            
            if (!downloaded) {
                return filesToUpdate;
            }
            
            // Listar arquivos do ZIP
            try (ZipInputStream zis = new ZipInputStream(new FileInputStream(downloadPath))) {
                ZipEntry entry;
                while ((entry = zis.getNextEntry()) != null) {
                    if (!entry.isDirectory() && !isProtected(entry.getName())) {
                        filesToUpdate.add(entry.getName());
                    }
                }
            }
            
            // Limpar arquivo temporário
            Files.deleteIfExists(Paths.get(downloadPath));
            
        } catch (Exception e) {
            LOGGER.error("Erro ao fazer preview: " + e.getMessage(), e);
        }
        
        return filesToUpdate;
    }
    
    public boolean isInstallEnabled() {
        return installEnabled;
    }
    
    /**
     * Reinicia os containers Docker (backend e frontend se necessário)
     */
    public boolean reiniciarContainerDocker() {
        return reiniciarContainerDocker(false);
    }
    
    /**
     * Reinicia o container Docker
     * @param reiniciarFrontend Se true, também reinicia o frontend
     * Retorna true se conseguir executar o comando, false caso contrário
     */
    public boolean reiniciarContainerDocker(boolean reiniciarFrontend) {
        try {
            // Verificar se estamos rodando em Docker
            boolean isDocker = Files.exists(Paths.get("/.dockerenv")) || 
                              System.getenv("container") != null ||
                              System.getProperty("java.class.path").contains("docker");
            
            if (!isDocker) {
                LOGGER.warn("Sistema não está rodando em Docker. Reinício automático não disponível.");
                return false;
            }
            
            // Tentar obter nome do container (prioridade: config > env > hostname > padrão)
            String containerName = null;
            
            // 1. Verificar configuração do application.properties
            if (containerNameConfig.isPresent() && !containerNameConfig.get().isEmpty()) {
                containerName = containerNameConfig.get();
            }
            
            // 2. Verificar variável de ambiente CONTAINER_NAME
            if (containerName == null || containerName.isEmpty()) {
                containerName = System.getenv("CONTAINER_NAME");
            }
            
            // 3. Verificar HOSTNAME (geralmente é o nome do container)
            if (containerName == null || containerName.isEmpty()) {
                containerName = System.getenv("HOSTNAME");
            }
            
            // 4. Usar padrão se nada foi encontrado
            if (containerName == null || containerName.isEmpty()) {
                containerName = "aerosuite-backend";
            }
            
            LOGGER.info("Nome do container detectado: " + containerName);
            
            LOGGER.info("Reiniciando container Docker: " + containerName);
            
            // Tentar diferentes métodos de reinicialização
            
            // Método 1: Usar docker CLI (se disponível)
            boolean reiniciado = tentarReiniciarViaDockerCLI(containerName);
            
            if (!reiniciado) {
                // Método 2: Usar Docker API (se socket disponível)
                reiniciado = tentarReiniciarViaDockerAPI(containerName);
            }
            
            // Se precisar reiniciar frontend também
            if (reiniciarFrontend) {
                String frontendContainerName = "aerosuite-frontend";
                LOGGER.info("Reiniciando também o container do frontend: " + frontendContainerName);
                tentarReiniciarViaDockerCLI(frontendContainerName);
            }
            
            if (!reiniciado) {
                LOGGER.warn("Não foi possível reiniciar via Docker. O container será reiniciado automaticamente pelo 'restart: unless-stopped'.");
            }
            
            return reiniciado;
        } catch (Exception e) {
            LOGGER.error("Erro ao reiniciar container Docker: " + e.getMessage(), e);
            return false;
        }
    }
    
    /**
     * Tenta reiniciar via Docker CLI
     */
    private boolean tentarReiniciarViaDockerCLI(String containerName) {
        try {
            // Verificar se docker está disponível
            ProcessBuilder checkPb = new ProcessBuilder("which", "docker");
            Process checkProcess = checkPb.start();
            int checkExitCode = checkProcess.waitFor();
            
            if (checkExitCode != 0) {
                LOGGER.debug("Docker CLI não encontrado no PATH");
                return false;
            }
            
            // Criar script temporário para reiniciar o container
            Path scriptPath = Paths.get(System.getProperty("java.io.tmpdir"), "restart-docker-" + System.currentTimeMillis() + ".sh");
            try (BufferedWriter writer = Files.newBufferedWriter(scriptPath)) {
                writer.write("#!/bin/bash");
                writer.newLine();
                writer.write("docker restart " + containerName + " 2>&1");
                writer.newLine();
            }
            
            // Tornar executável
            scriptPath.toFile().setExecutable(true);
            
            // Executar script em background (não bloqueia)
            ProcessBuilder pb = new ProcessBuilder("sh", scriptPath.toString());
            pb.redirectErrorStream(true);
            pb.start(); // Executar assincronamente, não esperar
            
            // Não esperar pelo processo (execução assíncrona)
            LOGGER.info("Comando de reinicialização Docker CLI executado: docker restart " + containerName);
            return true;
            
        } catch (Exception e) {
            LOGGER.debug("Erro ao reiniciar via Docker CLI: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Tenta reiniciar via Docker API (requer socket montado)
     */
    private boolean tentarReiniciarViaDockerAPI(String containerName) {
        try {
            // Verificar se Docker socket está disponível
            String dockerHost = dockerHostConfig.orElse(System.getenv("DOCKER_HOST"));
            if (dockerHost == null || dockerHost.isEmpty()) {
                dockerHost = "unix:///var/run/docker.sock";
            }
            
            Path dockerSocket = Paths.get("/var/run/docker.sock");
            if (!Files.exists(dockerSocket)) {
                LOGGER.debug("Docker socket não encontrado em /var/run/docker.sock");
                return false;
            }
            
            // Usar curl para chamar Docker API REST
            // POST /containers/{id}/restart
            String apiUrl = dockerHost.replace("unix://", "http://localhost");
            if (apiUrl.startsWith("http://localhost")) {
                // Para Unix socket, usar curl com --unix-socket
                ProcessBuilder pb = new ProcessBuilder(
                    "curl", 
                    "-X", "POST",
                    "--unix-socket", "/var/run/docker.sock",
                    "http://localhost/containers/" + containerName + "/restart"
                );
                
                pb.start(); // Executar assincronamente, não esperar
                LOGGER.info("Comando de reinicialização Docker API executado para: " + containerName);
                return true;
            }
            
            return false;
            
        } catch (Exception e) {
            LOGGER.debug("Erro ao reiniciar via Docker API: " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Verifica e aplica atualização pendente na inicialização da aplicação
     */
    void onStart(@Observes StartupEvent ev) {
        try {
            LOGGER.info("=== VERIFICANDO ATUALIZAÇÕES PENDENTES ===");
            boolean aplicada = verificarEAplicarAtualizacaoPendente();
            if (aplicada) {
                LOGGER.warn("ATENÇÃO: Uma atualização foi aplicada. Sistema iniciando com nova versão.");
            } else {
                LOGGER.info("Nenhuma atualização pendente encontrada.");
            }
        } catch (Exception e) {
            LOGGER.error("Erro ao verificar atualizações pendentes na inicialização: " + e.getMessage(), e);
        }
    }
}


