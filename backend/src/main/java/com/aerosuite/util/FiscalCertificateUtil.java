package com.aerosuite.util;

import com.aerosuite.i18n.ApiI18nMessages;

import java.io.ByteArrayInputStream;
import java.security.KeyStore;
import java.security.cert.X509Certificate;
import java.time.LocalDate;
import java.time.ZoneId;
import java.util.Date;

public final class FiscalCertificateUtil {

    private FiscalCertificateUtil() {}

    public static LocalDate extractValidUntil(byte[] pfxBytes, char[] password) {
        if (pfxBytes == null || pfxBytes.length == 0) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_EMPTY));
        }
        try {
            KeyStore ks = KeyStore.getInstance("PKCS12");
            ks.load(new ByteArrayInputStream(pfxBytes), password);
            var aliases = ks.aliases();
            Date latest = null;
            while (aliases.hasMoreElements()) {
                String alias = aliases.nextElement();
                if (!ks.isKeyEntry(alias) && !ks.isCertificateEntry(alias)) {
                    continue;
                }
                var cert = ks.getCertificate(alias);
                if (cert instanceof X509Certificate x509) {
                    Date notAfter = x509.getNotAfter();
                    if (notAfter != null && (latest == null || notAfter.after(latest))) {
                        latest = notAfter;
                    }
                }
            }
            if (latest == null) {
                throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_INVALID_PKCS12));
            }
            return latest.toInstant().atZone(ZoneId.systemDefault()).toLocalDate();
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (Exception e) {
            throw new IllegalArgumentException(ApiI18nMessages.withDetail(ApiI18nMessages.FISCAL_CERT_INVALID_PASSWORD, e.getMessage()), e);
        }
    }

    public static void validateTipo(String tipo) {
        if (tipo == null || tipo.isBlank()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_TYPE_REQUIRED));
        }
        String up = tipo.trim().toUpperCase();
        if (!"A1".equals(up) && !"A3".equals(up)) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_TYPE_INVALID));
        }
    }

    public static String normalizeTipo(String tipo) {
        validateTipo(tipo);
        return tipo.trim().toUpperCase();
    }
}
