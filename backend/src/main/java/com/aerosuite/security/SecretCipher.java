package com.aerosuite.security;

import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.annotation.PostConstruct;
import jakarta.enterprise.context.ApplicationScoped;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;
import java.util.logging.Logger;
import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import org.eclipse.microprofile.config.inject.ConfigProperty;

/**
 * Cifra simétrica para segredos em repouso (tokens OAuth por tenant).
 * Chave: {@code AERO_SUITE_SECRETS_KEY} (32+ chars) ou derivada do JWT em dev.
 */
@ApplicationScoped
public class SecretCipher {

    private static final Logger LOGGER = Logger.getLogger(SecretCipher.class.getName());
    private static final int GCM_IV_LENGTH = 12;
    private static final int GCM_TAG_LENGTH = 128;

    @ConfigProperty(name = "aero.suite.secrets.key")
    java.util.Optional<String> secretsKey;

    @ConfigProperty(name = "aero.suite.jwt.secret", defaultValue = "dev-only-secret-change-in-production-min-32chars")
    String jwtSecret;

    private byte[] aesKey;

    @PostConstruct
    void init() {
        String raw = secretsKey.filter(s -> !s.isBlank()).orElse(null);
        if (raw == null) {
            LOGGER.warning(
                    "AERO_SUITE_SECRETS_KEY não definida — derivando chave do JWT (apenas dev/homologação)");
            raw = jwtSecret;
        }
        aesKey = sha256(raw.getBytes(StandardCharsets.UTF_8));
    }

    public String encrypt(String plaintext) {
        if (plaintext == null) {
            return null;
        }
        try {
            byte[] iv = new byte[GCM_IV_LENGTH];
            new SecureRandom().nextBytes(iv);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, new SecretKeySpec(aesKey, "AES"), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            byte[] encrypted = cipher.doFinal(plaintext.getBytes(StandardCharsets.UTF_8));
            byte[] combined = new byte[iv.length + encrypted.length];
            System.arraycopy(iv, 0, combined, 0, iv.length);
            System.arraycopy(encrypted, 0, combined, iv.length, encrypted.length);
            return Base64.getEncoder().encodeToString(combined);
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.SECRET_ENCRYPT_FAILED, e.getMessage()), e);
        }
    }

    public String decrypt(String ciphertext) {
        if (ciphertext == null || ciphertext.isBlank()) {
            return null;
        }
        try {
            byte[] combined = Base64.getDecoder().decode(ciphertext);
            byte[] iv = new byte[GCM_IV_LENGTH];
            System.arraycopy(combined, 0, iv, 0, GCM_IV_LENGTH);
            byte[] encrypted = new byte[combined.length - GCM_IV_LENGTH];
            System.arraycopy(combined, GCM_IV_LENGTH, encrypted, 0, encrypted.length);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, new SecretKeySpec(aesKey, "AES"), new GCMParameterSpec(GCM_TAG_LENGTH, iv));
            return new String(cipher.doFinal(encrypted), StandardCharsets.UTF_8);
        } catch (Exception e) {
            throw new IllegalStateException(ApiI18nMessages.withDetail(ApiI18nMessages.SECRET_DECRYPT_FAILED, e.getMessage()), e);
        }
    }

    private static byte[] sha256(byte[] input) {
        try {
            return MessageDigest.getInstance("SHA-256").digest(input);
        } catch (Exception e) {
            throw new IllegalStateException(e);
        }
    }
}
