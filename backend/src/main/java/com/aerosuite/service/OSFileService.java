package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import org.jboss.logging.Logger;
import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.OSAuditoria.AcaoAuditoria;
import com.aerosuite.domain.OSFile;
import com.aerosuite.dto.OSFileDto;
import com.aerosuite.mapping.OSFileMapper;
import com.aerosuite.os.OsRegistroEncerradoGuard;
import com.aerosuite.security.TenantDataAccess;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.NotFoundException;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.stream.Collectors;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@ApplicationScoped
public class OSFileService {

    private static final Logger LOG = Logger.getLogger(OSFileService.class);
    
    @Inject
    OSFileMapper mapper;

    @Inject
    OSAuditoriaService auditoriaService;

    @Inject
    ObjectMapper objectMapper;

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    OsRegistroEncerradoGuard registroEncerradoGuard;
    
    @Inject
    DocxToPdfConverter docxConverter; // Pode ser null se não estiver disponível
    
    @ConfigProperty(name = "os.files.base.path")
    Optional<String> basePath;

    private record OsAuditKey(long idInternal, int numeroNegocio) {}

    private OsAuditKey resolveAuditKey(Long osIdFromEntity) {
        if (osIdFromEntity == null || osIdFromEntity == 0L) {
            return new OsAuditKey(0L, 0);
        }
        OS os = OS.find("id = ?1", osIdFromEntity).firstResult();
        if (os == null) {
            return new OsAuditKey(osIdFromEntity, 0);
        }
        return new OsAuditKey(os.id, os.idOs != null ? os.idOs : 0);
    }

    private String toJsonArquivo(OSFile f, FileUpload upload, Map<String, Object> extra) {
        try {
            Map<String, Object> m = new LinkedHashMap<>();
            if (f != null) {
                m.put("osFileId", f.id);
                m.put("osId", f.osId);
                m.put("fileName", f.fileName);
                m.put("originalName", f.originalName);
                m.put("filePath", f.filePath);
                m.put("fileSizeBytes", f.fileSize);
                m.put("contentType", f.contentType);
                m.put("fileExtension", f.fileExtension);
                m.put("isActive", f.isActive);
                m.put("createdAt", f.createdAt != null ? f.createdAt.toString() : null);
                m.put("updatedAt", f.updatedAt != null ? f.updatedAt.toString() : null);
            }
            if (upload != null) {
                m.put("multipartOriginalFileName", upload.fileName());
                m.put("multipartContentType", upload.contentType());
                try {
                    Path part = upload.uploadedFile();
                    if (part != null && Files.exists(part)) {
                        m.put("multipartPartSizeBytesRecebido", Files.size(part));
                    }
                } catch (Exception ignored) {
                }
            }
            if (extra != null) {
                m.putAll(extra);
            }
            return objectMapper.writeValueAsString(m);
        } catch (Exception e) {
            return "{\"erro\":\"" + String.valueOf(e.getMessage()).replace("\"", "'") + "\"}";
        }
    }

    private void auditarArquivo(
        OsAuditKey key,
        AcaoAuditoria acao,
        String campoAlterado,
        String valorAnterior,
        String valorNovo,
        AuditoriaUsuarioContext ctx
    ) {
        if (ctx == null) {
            return;
        }
        auditoriaService.registrarEventoArquivo(
            key.idInternal(),
            key.numeroNegocio(),
            acao,
            campoAlterado,
            valorAnterior,
            valorNovo,
            ctx
        );
    }
    
    private static final String OS_FILES_ROOT = "os";
    private static final String OS_FILES_AVAILABLE_SUBDIR = "files";
    
    // Flag para indicar se o serviço está inicializado corretamente
    private volatile boolean initialized = false;
    private volatile boolean initializationFailed = false;
    
    /**
     * Verifica se o serviço está inicializado e funcional
     */
    private boolean isInitialized() {
        if (initializationFailed) {
            return false;
        }
        if (!initialized) {
            try {
                // Tentar obter o caminho base para verificar se está funcionando
                getBasePath();
                initialized = true;
            } catch (Exception e) {
                LOG.warnf(e, "OSFileService não pôde ser inicializado: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
                initializationFailed = true;
                return false;
            }
        }
        return true;
    }
    
    /**
     * Obtém o caminho base para os arquivos OS.
     * Se basePath estiver configurado, usa ele. Caso contrário, tenta detectar automaticamente.
     */
    private Path getBasePath() {
        try {
            if (basePath != null && basePath.isPresent() && !basePath.get().isBlank()) {
                Path configuredPath = Paths.get(basePath.get());
                if (Files.exists(configuredPath)) {
                    return configuredPath;
                }
            }
            
            // Tentar detectar automaticamente: procurar pela pasta "os" na raiz do projeto
            // Primeiro, tenta o diretório de trabalho atual
            Path currentDir = Paths.get("").toAbsolutePath();
            Path osPath = currentDir.resolve(OS_FILES_ROOT);
            
            if (Files.exists(osPath) && Files.isDirectory(osPath)) {
                return currentDir;
            }
            
            // Se não encontrou, tenta subir um nível (caso esteja rodando de dentro de uma subpasta)
            Path parentDir = currentDir.getParent();
            if (parentDir != null) {
                osPath = parentDir.resolve(OS_FILES_ROOT);
                if (Files.exists(osPath) && Files.isDirectory(osPath)) {
                    return parentDir;
                }
            }
            
            // Se ainda não encontrou, usa o diretório de trabalho atual
            return currentDir;
        } catch (Exception e) {
            // Em caso de erro, usar o diretório de trabalho atual como fallback
            LOG.warnf(e, "Erro ao determinar caminho base para arquivos OS: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return Paths.get("").toAbsolutePath();
        }
    }
    
    private Path getOSFilesRootPath() {
        return getBasePath().resolve(OS_FILES_ROOT);
    }
    
    private Path getAvailableFilesPath() {
        return getOSFilesRootPath().resolve(OS_FILES_AVAILABLE_SUBDIR);
    }
    
    /**
     * Lista todos os arquivos disponíveis na pasta "os/files"
     */
    public List<OSFileDto> listAvailableFiles() {
        List<OSFileDto> files = new ArrayList<>();
        
        if (!isInitialized()) {
            LOG.warn("OSFileService não está inicializado. Retornando lista vazia.");
            return files;
        }
        
        Path filesPath;
        try {
            filesPath = getAvailableFilesPath();
        } catch (Exception e) {
            LOG.warnf(e, "Erro ao obter caminho dos arquivos: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            return files;
        }
        
        
        if (!Files.exists(filesPath)) {
            LOG.warnf("Pasta não encontrada: %s", filesPath.toAbsolutePath());
            // Tentar criar a pasta se não existir
            try {
                Files.createDirectories(filesPath);
            } catch (IOException e) {
                LOG.warnf(e, "Erro ao criar pasta: %s", e.getMessage());
            }
            return files; // Retorna lista vazia se a pasta não existir
        }
        
        try {
            Files.walkFileTree(filesPath, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    if (attrs.isRegularFile()) {
                        OSFileDto dto = new OSFileDto();
                        dto.fileName = file.getFileName().toString();
                        dto.originalName = file.getFileName().toString();
                        dto.filePath = file.toString().replace("\\", "/");
                        dto.fileSize = attrs.size();
                        dto.fileExtension = getFileExtension(file.getFileName().toString());
                        dto.contentType = Files.probeContentType(file);
                        files.add(dto);
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
        } catch (IOException e) {
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FILE_LIST_FAILED, e.getMessage()), e);
        }
        
        return files;
    }
    
    /**
     * Associa arquivos a uma OS, criando a pasta e convertendo DOCX para PDF
     */
    @Transactional
    public List<OSFileDto> associateFilesToOS(Long osId, List<String> fileNames, AuditoriaUsuarioContext ctx) {
        if (fileNames == null || fileNames.isEmpty()) {
            return new ArrayList<>();
        }
        registroEncerradoGuard.assertMutacaoPermitida(tenantDataAccess.requireOS(osId));

        // Criar pasta da OS: os/{osId}
        Path osFolder = getOSFilesRootPath().resolve(osId.toString());
        try {
            Files.createDirectories(osFolder);
        } catch (IOException e) {
            LOG.warnf(e, "OSFileService.associateFilesToOS - Erro ao criar pasta: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FOLDER_CREATE_FAILED, String.valueOf(osId)), e);
        }
        
        List<OSFileDto> associatedFiles = new ArrayList<>();
        Path filesPath = getAvailableFilesPath();
        
        for (String fileName : fileNames) {
            // Buscar arquivo na pasta os/files
            Path sourceFile = filesPath.resolve(fileName);
            
            if (!Files.exists(sourceFile)) {
                // Tentar encontrar o arquivo recursivamente na pasta files
                sourceFile = findFileInDirectory(filesPath, fileName);
                if (sourceFile == null) {
                    LOG.warnf("Arquivo não encontrado na pasta os/files: %s", fileName);
                    continue;
                }
            }
            
            try {
                String originalFileName = sourceFile.getFileName().toString();
                Path targetFile;
                
                // Se for DOCX, converter para PDF
                if (docxConverter != null && docxConverter.isDocxFile(sourceFile)) {
                    String pdfFileName = originalFileName.replace(".docx", ".pdf");
                    targetFile = osFolder.resolve(pdfFileName);
                    docxConverter.convertDocxToPdf(sourceFile, targetFile);
                } else {
                    // Copiar arquivo diretamente
                    targetFile = osFolder.resolve(originalFileName);
                    Files.copy(sourceFile, targetFile, StandardCopyOption.REPLACE_EXISTING);
                }
                
                // Criar registro no banco
                OSFile osFile = new OSFile();
                osFile.osId = osId;
                osFile.fileName = targetFile.getFileName().toString();
                osFile.originalName = originalFileName;
                osFile.filePath = targetFile.toString().replace("\\", "/");
                osFile.fileSize = Files.size(targetFile);
                osFile.fileExtension = getFileExtension(targetFile.getFileName().toString());
                osFile.contentType = Files.probeContentType(targetFile);
                osFile.isActive = true;
                osFile.createdAt = LocalDateTime.now();
                osFile.updatedAt = LocalDateTime.now();
                osFile.persist();

                associatedFiles.add(mapper.toDto(osFile));

                if (ctx != null) {
                    OsAuditKey key = resolveAuditKey(osId);
                    boolean converted = docxConverter != null && docxConverter.isDocxFile(sourceFile);
                    Map<String, Object> extra = new LinkedHashMap<>();
                    extra.put("nomeSolicitadoNaAssociacao", fileName);
                    extra.put("caminhoOrigemBiblioteca", sourceFile.toString().replace("\\", "/"));
                    extra.put("docxConvertidoParaPdf", converted);
                    auditarArquivo(
                        key,
                        AcaoAuditoria.ASSOCIACAO_ARQUIVO,
                        "ARQUIVO_ASSOCIACAO",
                        null,
                        toJsonArquivo(osFile, null, extra),
                        ctx
                    );
                }

            } catch (Exception e) {
                LOG.warnf(e, "Erro ao processar arquivo %s: %s", fileName, e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        }
        
        return associatedFiles;
    }
    
    /**
     * Faz upload de arquivos para uma OS
     * Não há limitação de extensão ou tamanho de arquivo
     */
    @Transactional
    public List<OSFileDto> uploadFilesToOS(Long osId, List<FileUpload> files, AuditoriaUsuarioContext ctx) {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }
        registroEncerradoGuard.assertMutacaoPermitida(tenantDataAccess.requireOS(osId));

        // Criar pasta da OS: os/{osId}
        Path osFolder = getOSFilesRootPath().resolve(osId.toString());
        try {
            Files.createDirectories(osFolder);
        } catch (IOException e) {
            LOG.warnf(e, "OSFileService.uploadFilesToOS - Erro ao criar pasta: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FOLDER_CREATE_FAILED, String.valueOf(osId)), e);
        }
        
        List<OSFileDto> uploadedFiles = new ArrayList<>();
        
        for (FileUpload fileUpload : files) {
            try {
                String originalFileName = fileUpload.fileName();
                if (originalFileName == null || originalFileName.isBlank()) {
                    originalFileName = "arquivo_" + System.currentTimeMillis();
                }
                
                // Garantir nome único para evitar sobrescrever arquivos
                String uniqueFileName = generateUniqueFileName(osFolder, originalFileName);
                Path targetFile = osFolder.resolve(uniqueFileName);
                
                // Copiar o arquivo para a pasta da OS (usar cópia direta para melhor performance)
                Files.copy(fileUpload.uploadedFile(), targetFile, StandardCopyOption.REPLACE_EXISTING);
                
                // Criar registro no banco
                OSFile osFile = new OSFile();
                osFile.osId = osId;
                osFile.fileName = uniqueFileName;
                osFile.originalName = originalFileName;
                osFile.filePath = targetFile.toString().replace("\\", "/");
                osFile.fileSize = Files.size(targetFile);
                osFile.fileExtension = getFileExtension(uniqueFileName);
                osFile.contentType = fileUpload.contentType() != null ? fileUpload.contentType() : Files.probeContentType(targetFile);
                osFile.isActive = true;
                osFile.createdAt = LocalDateTime.now();
                osFile.updatedAt = LocalDateTime.now();
                osFile.persist();
                
                uploadedFiles.add(mapper.toDto(osFile));

                if (ctx != null) {
                    OsAuditKey key = resolveAuditKey(osId);
                    auditarArquivo(
                        key,
                        AcaoAuditoria.UPLOAD_ARQUIVO,
                        "ARQUIVO_UPLOAD_MULTIPART",
                        null,
                        toJsonArquivo(osFile, fileUpload, Map.of("destino", "pasta_principal_os")),
                        ctx
                    );
                }

            } catch (Exception e) {
                LOG.warnf(e, "Erro ao fazer upload do arquivo: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        }
        
        return uploadedFiles;
    }
    
    /**
     * Gera um nome único para o arquivo, adicionando sufixo se necessário
     */
    private String generateUniqueFileName(Path folder, String fileName) {
        Path target = folder.resolve(fileName);
        if (!Files.exists(target)) {
            return fileName;
        }
        
        String baseName = fileName;
        String extension = "";
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0) {
            baseName = fileName.substring(0, lastDot);
            extension = fileName.substring(lastDot);
        }
        
        int counter = 1;
        String newFileName;
        do {
            newFileName = baseName + "_" + counter + extension;
            target = folder.resolve(newFileName);
            counter++;
        } while (Files.exists(target));
        
        return newFileName;
    }
    
    /**
     * Lista todos os arquivos associados a uma OS
     */
    public List<OSFileDto> getFilesByOSId(Long osId) {
        tenantDataAccess.requireOS(osId);
        return OSFile.<OSFile>find("osId = ?1 and isActive = ?2", osId, true)
                .list()
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Obtém um arquivo específico da OS
     */
    public OSFileDto getFileById(Long fileId) {
        return mapper.toDto(tenantDataAccess.requireActiveOSFile(fileId));
    }
    
    /**
     * Remove um arquivo da OS (soft delete)
     */
    @Transactional
    public void removeFileFromOS(Long fileId, AuditoriaUsuarioContext ctx) {
        OSFile file = tenantDataAccess.requireActiveOSFile(fileId);
        registroEncerradoGuard.assertMutacaoPermitida(tenantDataAccess.requireOS(file.osId));
        String antes = toJsonArquivo(file, null, Map.of("momento", "antes_soft_delete"));
        file.isActive = false;
        file.updatedAt = LocalDateTime.now();
        file.persist();
        if (ctx != null) {
            OsAuditKey key = resolveAuditKey(file.osId);
            auditarArquivo(
                key,
                AcaoAuditoria.EXCLUSAO_ARQUIVO,
                "ARQUIVO_EXCLUSAO",
                antes,
                "{\"softDelete\":true,\"isActive\":false}",
                ctx
            );
        }
    }
    
    /**
     * Obtém o caminho físico do arquivo
     */
    public Path getFilePath(Long fileId) {
        OSFile file = tenantDataAccess.requireActiveOSFile(fileId);

        String storedPath = file.filePath;
        
        Path filePath = Paths.get(storedPath);
        
        // Se o caminho não é absoluto, tentar resolver com o base path
        if (!filePath.isAbsolute()) {
            Path basePath = getBasePath();
            filePath = basePath.resolve(storedPath);
        }
        
        // Se ainda não existe, tentar encontrar na estrutura de pastas
        if (!Files.exists(filePath)) {
            
            // Tentar resolver usando apenas o nome do arquivo na pasta da OS
            if (file.osId != null) {
                Path osFolder = getOSFilesRootPath().resolve(file.osId.toString());
                Path altPath = osFolder.resolve(file.fileName);
                
                if (Files.exists(altPath)) {
                    return altPath;
                }
            }
        }
        
        return filePath;
    }

    /**
     * Lê o conteúdo binário do anexo da OS, se o ficheiro existir no disco.
     */
    public Optional<byte[]> readFileBytes(Long fileId) {
        try {
            Path path = getFilePath(fileId);
            if (path != null && Files.exists(path) && Files.isRegularFile(path)) {
                return Optional.of(Files.readAllBytes(path));
            }
        } catch (Exception e) {
            LOG.warnf(e, "OSFileService.readFileBytes - falha fileId= %s: %s", fileId, e.getMessage());
        }
        return Optional.empty();
    }
    
    /**
     * Busca um arquivo recursivamente em um diretório
     */
    private Path findFileInDirectory(Path directory, String fileName) {
        if (!Files.exists(directory)) {
            return null;
        }
        try {
            final Path[] found = {null};
            Files.walkFileTree(directory, new SimpleFileVisitor<Path>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) {
                    if (file.getFileName().toString().equals(fileName)) {
                        found[0] = file;
                        return FileVisitResult.TERMINATE;
                    }
                    return FileVisitResult.CONTINUE;
                }
            });
            return found[0];
        } catch (IOException e) {
            return null;
        }
    }
    
    /**
     * Obtém a extensão do arquivo
     */
    private String getFileExtension(String fileName) {
        int lastDot = fileName.lastIndexOf('.');
        if (lastDot > 0 && lastDot < fileName.length() - 1) {
            return fileName.substring(lastDot + 1).toLowerCase();
        }
        return "";
    }
    
    // ========================================
    // Métodos para Documentos Diversos (Avulsos)
    // ========================================
    
    private static final String DIVERSOS_FOLDER = "diversos";
    private static final Long DIVERSOS_OS_ID = 0L; // ID especial para documentos diversos
    
    /**
     * Obtém o caminho da pasta "diversos"
     */
    private Path getDiversosPath() {
        return getOSFilesRootPath()
                .resolve("tenant-" + tenantDataAccess.currentTenantIdStr())
                .resolve(DIVERSOS_FOLDER);
    }
    
    /**
     * Faz upload de arquivos para a pasta "diversos" (documentos avulsos)
     */
    @Transactional
    public List<OSFileDto> uploadFilesToDiversos(List<FileUpload> files, AuditoriaUsuarioContext ctx) {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }
        
        // Criar pasta diversos: os/diversos
        Path diversosFolder = getDiversosPath();
        try {
            Files.createDirectories(diversosFolder);
        } catch (IOException e) {
            LOG.warnf(e, "OSFileService.uploadFilesToDiversos - Erro ao criar pasta: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FOLDER_DIVERSOS_FAILED, e.getMessage()), e);
        }
        
        List<OSFileDto> uploadedFiles = new ArrayList<>();
        
        for (FileUpload fileUpload : files) {
            try {
                String originalFileName = fileUpload.fileName();
                if (originalFileName == null || originalFileName.isBlank()) {
                    originalFileName = "arquivo_" + System.currentTimeMillis();
                }
                
                // Garantir nome único para evitar sobrescrever arquivos
                String uniqueFileName = generateUniqueFileName(diversosFolder, originalFileName);
                Path targetFile = diversosFolder.resolve(uniqueFileName);
                
                // Copiar o arquivo para a pasta diversos
                try (InputStream is = Files.newInputStream(fileUpload.uploadedFile())) {
                    Files.copy(is, targetFile, StandardCopyOption.REPLACE_EXISTING);
                }
                
                // Criar registro no banco com osId = 0 (indicando documento avulso)
                OSFile osFile = new OSFile();
                osFile.tenantId = tenantDataAccess.currentTenantIdStr();
                osFile.osId = DIVERSOS_OS_ID;
                osFile.fileName = uniqueFileName;
                osFile.originalName = originalFileName;
                osFile.filePath = targetFile.toString().replace("\\", "/");
                osFile.fileSize = Files.size(targetFile);
                osFile.fileExtension = getFileExtension(uniqueFileName);
                osFile.contentType = fileUpload.contentType() != null ? fileUpload.contentType() : Files.probeContentType(targetFile);
                osFile.isActive = true;
                osFile.createdAt = LocalDateTime.now();
                osFile.updatedAt = LocalDateTime.now();
                osFile.persist();
                
                uploadedFiles.add(mapper.toDto(osFile));

                if (ctx != null) {
                    OsAuditKey keyGlobal = new OsAuditKey(0L, 0);
                    auditarArquivo(
                        keyGlobal,
                        AcaoAuditoria.UPLOAD_ARQUIVO,
                        "ARQUIVO_UPLOAD_DIVERSOS_GLOBAL",
                        null,
                        toJsonArquivo(osFile, fileUpload, Map.of("destino", "os/diversos_global")),
                        ctx
                    );
                }

            } catch (Exception e) {
                LOG.warnf(e, "Erro ao fazer upload do arquivo para diversos: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        }
        
        return uploadedFiles;
    }
    
    /**
     * Lista todos os arquivos da pasta "diversos" (osId = 0)
     */
    public List<OSFileDto> getFilesByDiversos() {
        return OSFile.<OSFile>find("osId = ?1 and isActive = ?2", DIVERSOS_OS_ID, true)
                .list()
                .stream()
                .map(mapper::toDto)
                .collect(Collectors.toList());
    }
    
    /**
     * Faz upload de arquivos para a pasta "diversos" dentro de uma OS específica
     * Os arquivos serão salvos em os/{osId}/diversos/
     */
    @Transactional
    public List<OSFileDto> uploadFilesToOSDiversos(Long osId, List<FileUpload> files, AuditoriaUsuarioContext ctx) {
        if (files == null || files.isEmpty()) {
            return new ArrayList<>();
        }
        registroEncerradoGuard.assertMutacaoPermitida(tenantDataAccess.requireOS(osId));

        // Criar pasta diversos dentro da OS: os/{osId}/diversos
        Path osDiversosFolder = getOSFilesRootPath().resolve(osId.toString()).resolve(DIVERSOS_FOLDER);
        try {
            Files.createDirectories(osDiversosFolder);
        } catch (IOException e) {
            LOG.warnf(e, "OSFileService.uploadFilesToOSDiversos - Erro ao criar pasta: %s", e.getMessage());
            LOG.warnf(e, "Erro inesperado");
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.OS_FOLDER_DIVERSOS_OS_FAILED, String.valueOf(osId)), e);
        }
        
        List<OSFileDto> uploadedFiles = new ArrayList<>();
        
        for (FileUpload fileUpload : files) {
            try {
                String originalFileName = fileUpload.fileName();
                if (originalFileName == null || originalFileName.isBlank()) {
                    originalFileName = "arquivo_" + System.currentTimeMillis();
                }
                
                // Garantir nome único para evitar sobrescrever arquivos
                String uniqueFileName = generateUniqueFileName(osDiversosFolder, originalFileName);
                Path targetFile = osDiversosFolder.resolve(uniqueFileName);
                
                // Copiar o arquivo para a pasta diversos da OS
                try (InputStream is = Files.newInputStream(fileUpload.uploadedFile())) {
                    Files.copy(is, targetFile, StandardCopyOption.REPLACE_EXISTING);
                }
                
                // Criar registro no banco - osId é o ID da OS real, não 0
                // O filePath indica que é um documento na pasta diversos
                OSFile osFile = new OSFile();
                osFile.osId = osId;
                osFile.fileName = uniqueFileName;
                osFile.originalName = originalFileName;
                osFile.filePath = targetFile.toString().replace("\\", "/");
                osFile.fileSize = Files.size(targetFile);
                osFile.fileExtension = getFileExtension(uniqueFileName);
                osFile.contentType = fileUpload.contentType() != null ? fileUpload.contentType() : Files.probeContentType(targetFile);
                osFile.isActive = true;
                osFile.createdAt = LocalDateTime.now();
                osFile.updatedAt = LocalDateTime.now();
                osFile.persist();
                
                uploadedFiles.add(mapper.toDto(osFile));

                if (ctx != null) {
                    OsAuditKey key = resolveAuditKey(osId);
                    auditarArquivo(
                        key,
                        AcaoAuditoria.UPLOAD_ARQUIVO,
                        "ARQUIVO_UPLOAD_DIVERSOS_OS",
                        null,
                        toJsonArquivo(osFile, fileUpload, Map.of("destino", "os/{osId}/diversos")),
                        ctx
                    );
                }

            } catch (Exception e) {
                LOG.warnf(e, "Erro ao fazer upload do arquivo para OS diversos: %s", e.getMessage());
                LOG.warnf(e, "Erro inesperado");
            }
        }
        
        return uploadedFiles;
    }
}
