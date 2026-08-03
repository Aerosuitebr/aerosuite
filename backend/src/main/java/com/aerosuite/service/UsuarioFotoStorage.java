package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.domain.Usuario;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.transaction.Transactional;
import org.eclipse.microprofile.config.inject.ConfigProperty;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;

/**
 * Armazenamento consistente de fotos de perfil (caminho absoluto configurável).
 */
@ApplicationScoped
public class UsuarioFotoStorage {

    public static final String PUBLIC_URL_PREFIX = "/api/public/usuario-foto/";

    @ConfigProperty(name = "aero.suite.usuario-foto.dir", defaultValue = "data/uploads/usuarios")
    String usuarioFotoDir;

    public Path rootDirectory() {
        Path p = Path.of(usuarioFotoDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(p);
        } catch (IOException e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.USER_PHOTO_FOLDER_CREATE_FAILED, p.toString()), e);
        }
        return p;
    }

    public String extractFilename(String storedValue) {
        if (storedValue == null || storedValue.isBlank()) {
            return null;
        }
        String s = storedValue.trim().replace('\\', '/');
        if (s.contains("/")) {
            return s.substring(s.lastIndexOf('/') + 1);
        }
        return s;
    }

    public String publicUrl(String filename) {
        if (filename == null || filename.isBlank()) {
            return null;
        }
        return PUBLIC_URL_PREFIX + filename;
    }

    /** Valor persistido na BD (só o nome do ficheiro). */
    public String persistValue(String filename) {
        return filename;
    }

    public Path resolveFile(String storedValue) {
        String filename = extractFilename(storedValue);
        if (filename == null || filename.isBlank()) {
            return null;
        }
        if (filename.contains("..")) {
            return null;
        }

        Path primary = rootDirectory().resolve(filename);
        if (Files.isRegularFile(primary)) {
            return primary;
        }

        // Compatibilidade: uploads antigos na raiz do processo
        Path legacy = Path.of("uploads").resolve(filename).toAbsolutePath().normalize();
        if (Files.isRegularFile(legacy)) {
            return legacy;
        }

        return null;
    }

    @Transactional
    public byte[] loadImageForUser(int userId) throws IOException {
        if (userId <= 0) {
            return null;
        }
        Usuario usuario = Usuario.findById(userId);
        if (usuario == null || usuario.fotoPerfil == null || usuario.fotoPerfil.isBlank()) {
            return null;
        }
        return loadImageBytesForUsuario(usuario);
    }

    /**
     * Lê bytes da foto: disco primeiro; se ausente (rebuild sem volume), usa {@code usuario.foto_perfil_dados}.
     */
    @Transactional
    public byte[] loadImageBytes(String storedValue) throws IOException {
        if (storedValue == null || storedValue.isBlank()) {
            return null;
        }
        String filename = extractFilename(storedValue);
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            return null;
        }
        Path path = resolveFile(filename);
        if (path != null) {
            return Files.readAllBytes(path);
        }
        Usuario usuario = Usuario.find(
                        "fotoPerfil = ?1 or fotoPerfil = ?2 or fotoPerfil like ?3",
                        storedValue.trim(),
                        filename,
                        "%" + filename)
                .firstResult();
        if (usuario != null) {
            return bytesFromUsuarioBackup(usuario);
        }
        return null;
    }

    private byte[] loadImageBytesForUsuario(Usuario usuario) throws IOException {
        String filename = extractFilename(usuario.fotoPerfil);
        if (filename == null || filename.isBlank() || filename.contains("..")) {
            return bytesFromUsuarioBackup(usuario);
        }
        Path path = resolveFile(filename);
        if (path != null) {
            return Files.readAllBytes(path);
        }
        return bytesFromUsuarioBackup(usuario);
    }

    private static byte[] bytesFromUsuarioBackup(Usuario usuario) {
        if (usuario.fotoPerfilDados != null && usuario.fotoPerfilDados.length > 0) {
            return usuario.fotoPerfilDados;
        }
        return null;
    }

    public String saveUploadedFile(int userId, Path uploadedTempFile, String originalFileName) throws IOException {
        String extension = "";
        if (originalFileName != null && originalFileName.contains(".")) {
            extension = originalFileName.substring(originalFileName.lastIndexOf('.'));
        }
        String filename = "foto_" + userId + "_" + System.currentTimeMillis() + extension;
        Path dest = rootDirectory().resolve(filename);
        Files.copy(uploadedTempFile, dest, StandardCopyOption.REPLACE_EXISTING);
        return filename;
    }
}
