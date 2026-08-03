package com.aerosuite.service;

import com.aerosuite.domain.TenantConstants;
import jakarta.enterprise.context.ApplicationScoped;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

@ApplicationScoped
public class StudioFileStorage {

    @ConfigProperty(name = "aero.suite.empresa-assets.dir", defaultValue = "empresa-assets")
    String empresaAssetsDir;

    public Path jobDir(long tenantId, long jobId) throws IOException {
        Path dir = Path.of(empresaAssetsDir, "studio", TenantConstants.tenantIdOf(tenantId), String.valueOf(jobId));
        Files.createDirectories(dir);
        return dir;
    }

    public Path uploadDir(long tenantId) throws IOException {
        Path dir = Path.of(empresaAssetsDir, "studio", TenantConstants.tenantIdOf(tenantId), "uploads");
        Files.createDirectories(dir);
        return dir;
    }

    public Path writeUpload(long tenantId, String fileName, byte[] content) throws IOException {
        Path target = uploadDir(tenantId).resolve(sanitize(fileName));
        Files.write(target, content);
        return target;
    }

    public String uploadPublicPath(long tenantId, String fileName) {
        return "studio/" + TenantConstants.tenantIdOf(tenantId) + "/uploads/" + sanitize(fileName);
    }

    public Path writeJobFile(long tenantId, long jobId, String fileName, byte[] content) throws IOException {
        Path target = jobDir(tenantId, jobId).resolve(sanitize(fileName));
        Files.write(target, content);
        return target;
    }

    public Path resolveStoredPath(String relativeOrAbsolute) {
        if (relativeOrAbsolute == null || relativeOrAbsolute.isBlank()) {
            return null;
        }
        Path p = Path.of(relativeOrAbsolute);
        return p.isAbsolute() ? p : Path.of(empresaAssetsDir).resolve(p).normalize();
    }

    public byte[] read(Path path) throws IOException {
        if (path == null || !Files.isRegularFile(path)) {
            return null;
        }
        return Files.readAllBytes(path);
    }

    private static String sanitize(String name) {
        return name.replaceAll("[^a-zA-Z0-9._-]", "_");
    }
}
