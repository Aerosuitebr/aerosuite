package com.aerosuite.service;

import com.aerosuite.domain.SgqDocumentoControlado;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.SgqDocumentoDto;
import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@ApplicationScoped
public class SgqDocumentoArquivoService {

    private static final Set<String> TIPOS_PERMITIDOS =
            Set.of("application/pdf", "application/x-pdf");

    private static final long MAX_BYTES = 25L * 1024 * 1024;

    @ConfigProperty(name = "sgq.documentos.base.path")
    Optional<String> basePath;

    @Inject
    SgqDocumentoService documentoService;

    @Transactional
    public SgqDocumentoDto uploadArquivo(Long documentoId, FileUpload upload) {
        SgqDocumentoControlado doc = requireDocumento(documentoId);
        if (upload == null || upload.fileName() == null || upload.fileName().isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("sgq.error.arquivo_obrigatorio"));
        }
        String contentType = upload.contentType() != null ? upload.contentType().toLowerCase(Locale.ROOT) : "";
        String ext = extensionFrom(upload.fileName(), contentType);
        if (!".pdf".equalsIgnoreCase(ext)) {
            throw new BadRequestException(ApiI18nMessages.domain("sgq.error.arquivo_apenas_pdf"));
        }
        if (!contentType.isBlank() && !TIPOS_PERMITIDOS.contains(contentType)) {
            throw new BadRequestException(ApiI18nMessages.domain("sgq.error.arquivo_apenas_pdf"));
        }
        try {
            Path source = upload.uploadedFile();
            if (source == null || !Files.exists(source)) {
                throw new BadRequestException(ApiI18nMessages.domain("sgq.error.arquivo_obrigatorio"));
            }
            long size = Files.size(source);
            if (size > MAX_BYTES) {
                throw new BadRequestException(ApiI18nMessages.domain("sgq.error.arquivo_grande"));
            }
            String stored =
                    (doc.tenantId != null ? doc.tenantId : TenantConstants.DEFAULT_TENANT_ID_STR)
                            + "/"
                            + doc.id
                            + "/"
                            + UUID.randomUUID()
                            + ext;
            Path target = getBasePath().resolve(stored);
            Files.createDirectories(target.getParent());
            Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
            deleteArquivoSilencioso(doc.arquivoPath);
            doc.arquivoPath = stored;
            doc.arquivoNome = sanitizeFileName(upload.fileName());
            doc.arquivoContentType = contentType.isBlank() ? "application/pdf" : contentType;
            doc.arquivoTamanho = size;
            doc.persist();
            return documentoService.obter(doc.id);
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException(ApiI18nMessages.domain("sgq.error.arquivo_upload_falhou"));
        }
    }

    public Path resolveArquivoPath(Long documentoId) {
        SgqDocumentoControlado doc = requireDocumento(documentoId);
        if (doc.arquivoPath == null || doc.arquivoPath.isBlank()) {
            throw new NotFoundException(ApiI18nMessages.domain("sgq.error.sem_arquivo"));
        }
        Path path = getBasePath().resolve(doc.arquivoPath);
        if (!Files.exists(path)) {
            throw new NotFoundException(ApiI18nMessages.domain("sgq.error.sem_arquivo"));
        }
        return path;
    }

    public SgqDocumentoControlado metaArquivo(Long documentoId) {
        return requireDocumento(documentoId);
    }

    private SgqDocumentoControlado requireDocumento(Long id) {
        if (id == null) {
            throw new BadRequestException(ApiI18nMessages.domain("sgq.error.id_invalido"));
        }
        SgqDocumentoControlado doc = SgqDocumentoControlado.findById(id);
        if (doc == null) {
            throw new NotFoundException(ApiI18nMessages.domain("sgq.error.nao_encontrado"));
        }
        return doc;
    }

    private Path getBasePath() {
        if (basePath != null && basePath.isPresent() && !basePath.get().isBlank()) {
            return Paths.get(basePath.get()).toAbsolutePath().normalize();
        }
        return Paths.get(System.getProperty("user.dir"), "uploads", "sgq-documentos")
                .toAbsolutePath()
                .normalize();
    }

    private void deleteArquivoSilencioso(String relativePath) {
        if (relativePath == null || relativePath.isBlank()) {
            return;
        }
        try {
            Files.deleteIfExists(getBasePath().resolve(relativePath));
        } catch (IOException ignored) {
        }
    }

    private static String extensionFrom(String fileName, String contentType) {
        if (fileName != null) {
            int dot = fileName.lastIndexOf('.');
            if (dot > 0) {
                return fileName.substring(dot).toLowerCase(Locale.ROOT);
            }
        }
        if ("application/pdf".equals(contentType)) {
            return ".pdf";
        }
        return "";
    }

    private static String sanitizeFileName(String name) {
        if (name == null) {
            return "documento.pdf";
        }
        String trimmed = name.trim();
        return trimmed.length() > 200 ? trimmed.substring(0, 200) : trimmed;
    }
}
