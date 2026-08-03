package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.Tenant;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;
import org.jboss.resteasy.reactive.multipart.FileUpload;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Armazena ficheiros de marca (logo / wordmark) em disco e expõe URL pública fixa.
 */
@ApplicationScoped
public class EmpresaAssetService {

    public static final String PUBLIC_LOGO_URL = "/api/public/empresa-asset/logo";
    public static final String PUBLIC_WORDMARK_URL = "/api/public/empresa-asset/wordmark";
    /** Mesmo arquivo do frontend {@code src/assets/Aero_Claro.png}. */
    public static final String DEFAULT_WHATSAPP_LOGO_RESOURCE = "META-INF/resources/Aero_Claro.png";

    public static String publicLogoUrlForTenantCodigo(String tenantCodigo) {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return null;
        }
        return "/api/public/empresa-asset/" + tenantCodigo.trim().toLowerCase() + "/logo";
    }

    public static String publicWordmarkUrlForTenantCodigo(String tenantCodigo) {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return null;
        }
        return "/api/public/empresa-asset/" + tenantCodigo.trim().toLowerCase() + "/wordmark";
    }

    private static final String LOGO_FILE = "company-logo";
    private static final String WORDMARK_FILE = "company-wordmark";

    @ConfigProperty(name = "aero.suite.empresa-assets.dir", defaultValue = "empresa-assets")
    String empresaAssetsDir;

    private Path baseDir() throws IOException {
        Path p = Path.of(empresaAssetsDir).toAbsolutePath().normalize();
        Files.createDirectories(p);
        return p;
    }

    public Path logoPath() throws IOException {
        return resolveExistingWithExtension(baseDir(), LOGO_FILE);
    }

    public Path wordmarkPath() throws IOException {
        return resolveExistingWithExtension(baseDir(), WORDMARK_FILE);
    }

    private static Path resolveExistingWithExtension(Path dir, String baseName) throws IOException {
        for (String ext : new String[] { ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg" }) {
            Path candidate = dir.resolve(baseName + ext);
            if (Files.isRegularFile(candidate)) {
                return candidate;
            }
        }
        return dir.resolve(baseName + ".png");
    }

    public String saveLogo(FileUpload file) throws IOException {
        return saveImage(file, LOGO_FILE);
    }

    public String saveLogoForTenant(long tenantId, FileUpload file) throws IOException {
        saveImageInDir(tenantDir(tenantId), file, LOGO_FILE);
        Tenant t = Tenant.findById(tenantId);
        return publicLogoUrlForTenantCodigo(t != null ? t.codigo : null);
    }

    public String saveWordmark(FileUpload file) throws IOException {
        return saveImage(file, WORDMARK_FILE);
    }

    public String saveWordmarkForTenant(long tenantId, FileUpload file) throws IOException {
        saveImageInDir(tenantDir(tenantId), file, WORDMARK_FILE);
        Tenant t = Tenant.findById(tenantId);
        return publicWordmarkUrlForTenantCodigo(t != null ? t.codigo : null);
    }

    private String saveImage(FileUpload file, String baseName) throws IOException {
        if (file == null || file.uploadedFile() == null) {
            throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_FILE_REQUIRED));
        }
        String ext = extensionFromUpload(file);
        Path target = baseDir().resolve(baseName + ext);
        Files.copy(file.uploadedFile(), target, StandardCopyOption.REPLACE_EXISTING);
        // Remover outras extensões do mesmo prefixo para evitar ambiguidade no GET
        for (String other : new String[] { ".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg" }) {
            if (other.equals(ext)) {
                continue;
            }
            Path sibling = baseDir().resolve(baseName + other);
            Files.deleteIfExists(sibling);
        }
        return LOGO_FILE.equals(baseName) ? PUBLIC_LOGO_URL : PUBLIC_WORDMARK_URL;
    }

    private static String extensionFromUpload(FileUpload file) {
        String ct = file.contentType();
        if (ct != null) {
            if (ct.contains("png")) {
                return ".png";
            }
            if (ct.contains("jpeg") || ct.contains("jpg")) {
                return ".jpg";
            }
            if (ct.contains("webp")) {
                return ".webp";
            }
            if (ct.contains("gif")) {
                return ".gif";
            }
            if (ct.contains("svg")) {
                return ".svg";
            }
        }
        String name = file.fileName();
        if (name != null && name.contains(".")) {
            return name.substring(name.lastIndexOf('.')).toLowerCase();
        }
        return ".png";
    }

    /** Logo global legado (empresa-assets raiz); senão {@link #openDefaultWhatsAppLogo()}. */
    public InputStream openLogo() throws IOException {
        Path p = resolveExistingWithExtension(baseDir(), LOGO_FILE);
        if (Files.isRegularFile(p)) {
            return Files.newInputStream(p);
        }
        return openDefaultWhatsAppLogo();
    }

    /**
     * Logo do tenant para WhatsApp/e-mail: upload da oficina ou {@code Aero_Claro.png} do produto.
     */
    public InputStream openLogoForTenant(long tenantId) throws IOException {
        Path p = resolveExistingWithExtension(tenantDir(tenantId), LOGO_FILE);
        if (Files.isRegularFile(p)) {
            return Files.newInputStream(p);
        }
        Path global = resolveExistingWithExtension(baseDir(), LOGO_FILE);
        if (Files.isRegularFile(global)) {
            return Files.newInputStream(global);
        }
        return openDefaultWhatsAppLogo();
    }

    /** {@code frontend/src/assets/Aero_Claro.png} empacotado no backend. */
    public InputStream openDefaultWhatsAppLogo() {
        InputStream in = Thread.currentThread().getContextClassLoader()
                .getResourceAsStream(DEFAULT_WHATSAPP_LOGO_RESOURCE);
        if (in == null) {
            in = getClass().getClassLoader().getResourceAsStream(DEFAULT_WHATSAPP_LOGO_RESOURCE);
        }
        return in;
    }

    public String guessLogoMediaTypeForTenant(long tenantId) throws IOException {
        Path p = resolveExistingWithExtension(tenantDir(tenantId), LOGO_FILE);
        if (Files.isRegularFile(p)) {
            return guessMediaType(p);
        }
        Path global = resolveExistingWithExtension(baseDir(), LOGO_FILE);
        if (Files.isRegularFile(global)) {
            return guessMediaType(global);
        }
        return "image/png";
    }

    public boolean hasCustomLogoForTenant(long tenantId) throws IOException {
        return Files.isRegularFile(resolveExistingWithExtension(tenantDir(tenantId), LOGO_FILE));
    }

    public InputStream openLogoForTenantCodigo(String tenantCodigo) throws IOException {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return openLogo();
        }
        Tenant tenant = Tenant.find("codigo = ?1 and ativo = true", tenantCodigo.trim().toLowerCase())
                .firstResult();
        if (tenant == null || tenant.id == null) {
            return null;
        }
        Path p = resolveExistingWithExtension(tenantDir(tenant.id), LOGO_FILE);
        if (!Files.isRegularFile(p)) {
            return null;
        }
        return Files.newInputStream(p);
    }

    public String guessLogoMediaTypeForTenantCodigo(String tenantCodigo) throws IOException {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return guessLogoMediaType();
        }
        Tenant tenant = Tenant.find("codigo = ?1", tenantCodigo.trim().toLowerCase()).firstResult();
        if (tenant == null) {
            return guessLogoMediaType();
        }
        return guessMediaType(resolveExistingWithExtension(tenantDir(tenant.id), LOGO_FILE));
    }

    private Path tenantDir(long tenantId) throws IOException {
        Path p = baseDir().resolve("tenant-" + tenantId);
        Files.createDirectories(p);
        return p;
    }

    private String saveImageInDir(Path dir, FileUpload file, String baseName) throws IOException {
        if (file == null || file.uploadedFile() == null) {
            throw new IOException(ApiI18nMessages.encode(ApiI18nMessages.EMPRESA_FILE_REQUIRED));
        }
        String ext = extensionFromUpload(file);
        Path target = dir.resolve(baseName + ext);
        Files.copy(file.uploadedFile(), target, StandardCopyOption.REPLACE_EXISTING);
        for (String other : new String[] {".png", ".jpg", ".jpeg", ".webp", ".gif", ".svg"}) {
            if (other.equals(ext)) {
                continue;
            }
            Files.deleteIfExists(dir.resolve(baseName + other));
        }
        return LOGO_FILE.equals(baseName) ? PUBLIC_LOGO_URL : PUBLIC_WORDMARK_URL;
    }

    public InputStream openWordmark() throws IOException {
        return null;
    }

    public InputStream openWordmarkForTenantCodigo(String tenantCodigo) throws IOException {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return null;
        }
        Tenant tenant = Tenant.find("codigo = ?1 and ativo = true", tenantCodigo.trim().toLowerCase())
                .firstResult();
        if (tenant == null || tenant.id == null) {
            return null;
        }
        Path p = resolveExistingWithExtension(tenantDir(tenant.id), WORDMARK_FILE);
        if (!Files.isRegularFile(p)) {
            return null;
        }
        return Files.newInputStream(p);
    }

    public String guessWordmarkMediaTypeForTenantCodigo(String tenantCodigo) throws IOException {
        if (tenantCodigo == null || tenantCodigo.isBlank()) {
            return "application/octet-stream";
        }
        Tenant tenant = Tenant.find("codigo = ?1", tenantCodigo.trim().toLowerCase()).firstResult();
        if (tenant == null) {
            return "application/octet-stream";
        }
        return guessMediaType(resolveExistingWithExtension(tenantDir(tenant.id), WORDMARK_FILE));
    }

    public String guessLogoMediaType() throws IOException {
        return guessMediaType(logoPath());
    }

    public String guessWordmarkMediaType() throws IOException {
        return guessMediaType(wordmarkPath());
    }

    private static String guessMediaType(Path p) {
        String n = p.getFileName().toString().toLowerCase();
        if (n.endsWith(".png")) {
            return "image/png";
        }
        if (n.endsWith(".jpg") || n.endsWith(".jpeg")) {
            return "image/jpeg";
        }
        if (n.endsWith(".webp")) {
            return "image/webp";
        }
        if (n.endsWith(".gif")) {
            return "image/gif";
        }
        if (n.endsWith(".svg")) {
            return "image/svg+xml";
        }
        return "application/octet-stream";
    }
}
