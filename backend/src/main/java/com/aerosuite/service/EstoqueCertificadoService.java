package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.ItemEstoque;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.CertificadoPecaDto;
import com.aerosuite.estoque.CertificadoPecaUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.time.LocalDate;
import java.util.Locale;
import java.util.Optional;
import java.util.Set;
import java.util.UUID;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

@ApplicationScoped
public class EstoqueCertificadoService {

    private static final Set<String> TIPOS_PERMITIDOS =
            Set.of(
                    "application/pdf",
                    "image/jpeg",
                    "image/jpg",
                    "image/png");

    @ConfigProperty(name = "estoque.certificados.base.path")
    Optional<String> basePath;

    public CertificadoPecaDto toDto(ItemEstoque item, boolean exigeAnexo) {
        CertificadoPecaDto dto = new CertificadoPecaDto();
        dto.certTipo = item.certTipo;
        dto.certNumero = item.certNumero;
        dto.certEmissor = item.certEmissor;
        dto.certDataEmissao = item.certDataEmissao;
        dto.dataValidade = item.dataValidade;
        dto.certOrgaoAprovacao = item.certOrgaoAprovacao;
        dto.certificadoConformidade = item.certificadoConformidade;
        dto.certAnexoNome = item.certAnexoNome;
        dto.temAnexo = CertificadoPecaUtil.temAnexo(item);
        dto.completo = CertificadoPecaUtil.isCompleto(item, exigeAnexo);
        return dto;
    }

    @Transactional
    public CertificadoPecaDto salvarCampos(Long itemId, CertificadoPecaDto body, boolean exigeAnexo) {
        ItemEstoque item = requireItem(itemId);
        if (body == null) {
            throw new BadRequestException(ApiI18nMessages.domain("estoque.certificado.error.corpo_obrigatorio"));
        }
        CertificadoPecaUtil.aplicarCampos(
                item,
                body.certTipo,
                body.certNumero,
                body.certEmissor,
                body.certDataEmissao,
                body.dataValidade,
                body.certOrgaoAprovacao,
                body.certificadoConformidade);
        item.persist();
        return toDto(item, exigeAnexo);
    }

    @Transactional
    public CertificadoPecaDto uploadAnexo(Long itemId, FileUpload upload, boolean exigeAnexo) {
        ItemEstoque item = requireItem(itemId);
        if (upload == null || upload.fileName() == null || upload.fileName().isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("estoque.certificado.error.anexo_obrigatorio"));
        }
        String contentType = upload.contentType() != null ? upload.contentType().toLowerCase(Locale.ROOT) : "";
        if (!contentType.isBlank() && !TIPOS_PERMITIDOS.contains(contentType)) {
            throw new BadRequestException(ApiI18nMessages.domain("estoque.certificado.error.tipo_arquivo"));
        }
        try {
            Path source = upload.uploadedFile();
            if (source == null || !Files.exists(source)) {
                throw new BadRequestException(ApiI18nMessages.domain("estoque.certificado.error.anexo_obrigatorio"));
            }
            long size = Files.size(source);
            if (size > 15 * 1024 * 1024) {
                throw new BadRequestException(ApiI18nMessages.domain("estoque.certificado.error.arquivo_grande"));
            }
            String ext = extensionFrom(upload.fileName(), contentType);
            String stored =
                    (item.tenantId != null ? item.tenantId : TenantConstants.DEFAULT_TENANT_ID_STR)
                            + "/"
                            + item.id
                            + "/"
                            + UUID.randomUUID()
                            + ext;
            Path target = getBasePath().resolve(stored);
            Files.createDirectories(target.getParent());
            Files.copy(source, target, StandardCopyOption.REPLACE_EXISTING);
            if (item.certAnexoPath != null && !item.certAnexoPath.isBlank()) {
                try {
                    Files.deleteIfExists(getBasePath().resolve(item.certAnexoPath));
                } catch (IOException ignored) {
                }
            }
            item.certAnexoPath = stored;
            item.certAnexoNome = sanitizeFileName(upload.fileName());
            item.certAnexoContentType =
                    contentType.isBlank() ? "application/octet-stream" : contentType;
            item.certAnexoTamanho = size;
            item.persist();
            return toDto(item, exigeAnexo);
        } catch (BadRequestException e) {
            throw e;
        } catch (IOException e) {
            throw new BadRequestException(ApiI18nMessages.domain("estoque.certificado.error.upload_falhou"));
        }
    }

    public Path resolveAnexoPath(ItemEstoque item) {
        if (!CertificadoPecaUtil.temAnexo(item)) {
            throw new NotFoundException(ApiI18nMessages.domain("estoque.certificado.error.sem_anexo"));
        }
        Path path = getBasePath().resolve(item.certAnexoPath);
        if (!Files.exists(path)) {
            throw new NotFoundException(ApiI18nMessages.domain("estoque.certificado.error.sem_anexo"));
        }
        return path;
    }

    private ItemEstoque requireItem(Long itemId) {
        ItemEstoque item = ItemEstoque.find("id = ?1", itemId).firstResult();
        if (item == null) {
            throw new NotFoundException(
                    com.aerosuite.i18n.ApiI18nMessages.encode(
                            "estoque.error.item_not_found", "id", String.valueOf(itemId)));
        }
        return item;
    }

    private Path getBasePath() {
        if (basePath != null && basePath.isPresent() && !basePath.get().isBlank()) {
            return Paths.get(basePath.get()).toAbsolutePath().normalize();
        }
        return Paths.get(System.getProperty("user.dir"), "uploads", "estoque-certificados")
                .toAbsolutePath()
                .normalize();
    }

    private static String extensionFrom(String fileName, String contentType) {
        if (fileName != null && fileName.contains(".")) {
            return fileName.substring(fileName.lastIndexOf('.')).toLowerCase(Locale.ROOT);
        }
        if (contentType.contains("pdf")) {
            return ".pdf";
        }
        if (contentType.contains("png")) {
            return ".png";
        }
        if (contentType.contains("jpeg") || contentType.contains("jpg")) {
            return ".jpg";
        }
        return ".bin";
    }

    private static String sanitizeFileName(String name) {
        if (name == null) {
            return "certificado";
        }
        return name.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
    }
}
