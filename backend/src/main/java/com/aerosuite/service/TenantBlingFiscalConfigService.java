package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.TenantBlingFiscalConfig;
import com.aerosuite.integration.bling.BlingFiscalConfigDto;
import com.aerosuite.integration.bling.BlingFiscalConfigUpdateDto;
import com.aerosuite.security.SecretCipher;
import com.aerosuite.util.FiscalCertificateUtil;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDateTime;
import java.util.Base64;

@ApplicationScoped
public class TenantBlingFiscalConfigService {

    @Inject
    SecretCipher secretCipher;

    public BlingFiscalConfigDto getView(long tenantId) {
        TenantBlingFiscalConfig row = TenantBlingFiscalConfig.findForTenant(tenantId);
        BlingFiscalConfigDto dto = new BlingFiscalConfigDto();
        dto.tenantId = tenantId;
        if (row == null) {
            dto.autoOsOnPedido = true;
            dto.autoEmitirNfe = true;
            dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_FISCAL_USING_DEFAULTS);
            return dto;
        }
        mapToDto(row, dto);
        return dto;
    }

    public TenantBlingFiscalConfig resolveEffective(long tenantId) {
        TenantBlingFiscalConfig row = TenantBlingFiscalConfig.findForTenant(tenantId);
        return row != null ? row : TenantBlingFiscalConfig.getOrCreate(tenantId);
    }

    @Transactional
    public BlingFiscalConfigDto update(long tenantId, BlingFiscalConfigUpdateDto input) {
        TenantBlingFiscalConfig row = TenantBlingFiscalConfig.getOrCreate(tenantId);
        if (input.cfopPadrao != null) {
            row.cfopPadrao = trimOrNull(input.cfopPadrao);
        }
        if (input.serieNfe != null) {
            row.serieNfe = trimOrNull(input.serieNfe);
        }
        if (input.naturezaOperacao != null) {
            row.naturezaOperacao = trimOrNull(input.naturezaOperacao);
        }
        if (input.ncmPadrao != null) {
            row.ncmPadrao = trimOrNull(input.ncmPadrao);
        }
        if (input.aliquotaIcms != null) {
            row.aliquotaIcms = input.aliquotaIcms;
        }
        if (input.aliquotaPis != null) {
            row.aliquotaPis = input.aliquotaPis;
        }
        if (input.aliquotaCofins != null) {
            row.aliquotaCofins = input.aliquotaCofins;
        }
        if (input.autoOsOnPedido != null) {
            row.autoOsOnPedido = input.autoOsOnPedido;
        }
        if (input.autoEmitirNfe != null) {
            row.autoEmitirNfe = input.autoEmitirNfe;
        }
        row.persist();
        BlingFiscalConfigDto dto = new BlingFiscalConfigDto();
        mapToDto(row, dto);
        dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_FISCAL_SAVED);
        return dto;
    }

    @Transactional
    public BlingFiscalConfigDto uploadCertificado(
            long tenantId, byte[] pfxBytes, String fileName, String password, String tipo) {
        if (pfxBytes == null || pfxBytes.length == 0) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.BLING_CERT_REQUIRED));
        }
        if (password == null || password.isBlank()) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.FISCAL_CERT_PASSWORD_REQUIRED));
        }
        String tipoNorm = FiscalCertificateUtil.normalizeTipo(tipo);
        var validUntil = FiscalCertificateUtil.extractValidUntil(pfxBytes, password.toCharArray());

        TenantBlingFiscalConfig row = TenantBlingFiscalConfig.getOrCreate(tenantId);
        row.certificadoTipo = tipoNorm;
        row.certificadoNome = fileName != null ? fileName.trim() : "certificado.pfx";
        row.certificadoPfxEnc = secretCipher.encrypt(Base64.getEncoder().encodeToString(pfxBytes));
        row.certificadoSenhaEnc = secretCipher.encrypt(password);
        row.certificadoValidoAte = validUntil;
        row.certificadoUploadedAt = LocalDateTime.now();
        row.persist();

        BlingFiscalConfigDto dto = new BlingFiscalConfigDto();
        mapToDto(row, dto);
        dto.message = ApiI18nMessages.encode(
                ApiI18nMessages.BLING_FISCAL_CERT_STORED, "tipo", tipoNorm);
        return dto;
    }

    @Transactional
    public BlingFiscalConfigDto removeCertificado(long tenantId) {
        TenantBlingFiscalConfig row = TenantBlingFiscalConfig.findForTenant(tenantId);
        if (row == null) {
            return getView(tenantId);
        }
        row.certificadoTipo = null;
        row.certificadoNome = null;
        row.certificadoPfxEnc = null;
        row.certificadoSenhaEnc = null;
        row.certificadoValidoAte = null;
        row.certificadoUploadedAt = null;
        row.persist();
        BlingFiscalConfigDto dto = new BlingFiscalConfigDto();
        mapToDto(row, dto);
        dto.message = ApiI18nMessages.encode(ApiI18nMessages.BLING_FISCAL_CERT_REMOVED);
        return dto;
    }

    private static void mapToDto(TenantBlingFiscalConfig row, BlingFiscalConfigDto dto) {
        dto.tenantId = row.tenantId;
        dto.cfopPadrao = row.cfopPadrao;
        dto.serieNfe = row.serieNfe;
        dto.naturezaOperacao = row.naturezaOperacao;
        dto.ncmPadrao = row.ncmPadrao;
        dto.aliquotaIcms = row.aliquotaIcms;
        dto.aliquotaPis = row.aliquotaPis;
        dto.aliquotaCofins = row.aliquotaCofins;
        dto.autoOsOnPedido = row.autoOsOnPedido;
        dto.autoEmitirNfe = row.autoEmitirNfe;
        dto.certificadoConfigurado = row.hasCertificado();
        dto.certificadoTipo = row.certificadoTipo;
        dto.certificadoNome = row.certificadoNome;
        dto.certificadoValidoAte =
                row.certificadoValidoAte != null ? row.certificadoValidoAte.toString() : null;
        dto.certificadoUploadedAt =
                row.certificadoUploadedAt != null ? row.certificadoUploadedAt.toString() : null;
    }

    private static String trimOrNull(String s) {
        if (s == null) {
            return null;
        }
        String t = s.trim();
        return t.isEmpty() ? null : t;
    }
}
