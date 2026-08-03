package com.aerosuite.service;

import com.aerosuite.domain.SistemaEmpresaConfig;
import com.aerosuite.dto.ConformidadeEnforcementConfigDto;
import com.aerosuite.dto.ConformidadeEnforcementConfigUpdateDto;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;

/**
 * P1 — políticas de bloqueio SGQ por tenant ({@code sistema_empresa_config}).
 */
@ApplicationScoped
public class ConformidadeEnforcementPolicyService {

    @Inject
    TenantDataAccess tenantDataAccess;

    public ConformidadeEnforcementConfigDto getConfig() {
        SistemaEmpresaConfig cfg = configForCurrentTenant();
        ConformidadeEnforcementConfigDto dto = new ConformidadeEnforcementConfigDto();
        dto.bloquearCalibracaoVencida = cfg != null && Boolean.TRUE.equals(cfg.conformidadeBloquearCalibracaoVencida);
        dto.bloquearTreinoObrigatorio = cfg != null && Boolean.TRUE.equals(cfg.conformidadeBloquearTreinoObrigatorio);
        dto.bloquearSubcontratacaoVencida =
                cfg != null && Boolean.TRUE.equals(cfg.conformidadeBloquearSubcontratacaoVencida);
        return dto;
    }

    public boolean bloquearCalibracaoVencida() {
        SistemaEmpresaConfig cfg = configForCurrentTenant();
        return cfg != null && Boolean.TRUE.equals(cfg.conformidadeBloquearCalibracaoVencida);
    }

    public boolean bloquearTreinoObrigatorio() {
        SistemaEmpresaConfig cfg = configForCurrentTenant();
        return cfg != null && Boolean.TRUE.equals(cfg.conformidadeBloquearTreinoObrigatorio);
    }

    public boolean bloquearSubcontratacaoVencida() {
        SistemaEmpresaConfig cfg = configForCurrentTenant();
        return cfg != null && Boolean.TRUE.equals(cfg.conformidadeBloquearSubcontratacaoVencida);
    }

    @Transactional
    public ConformidadeEnforcementConfigDto updateConfig(ConformidadeEnforcementConfigUpdateDto body) {
        SistemaEmpresaConfig cfg = configForCurrentTenant();
        if (cfg == null) {
            cfg = new SistemaEmpresaConfig();
            cfg.tenantId = com.aerosuite.domain.TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
            cfg.displayName = "";
            cfg.supportEmail = "suporte@aerosuite.local";
        }
        if (body != null) {
            if (body.bloquearCalibracaoVencida != null) {
                cfg.conformidadeBloquearCalibracaoVencida = body.bloquearCalibracaoVencida;
            }
            if (body.bloquearTreinoObrigatorio != null) {
                cfg.conformidadeBloquearTreinoObrigatorio = body.bloquearTreinoObrigatorio;
            }
            if (body.bloquearSubcontratacaoVencida != null) {
                cfg.conformidadeBloquearSubcontratacaoVencida = body.bloquearSubcontratacaoVencida;
            }
        }
        cfg.persist();
        return getConfig();
    }

    private SistemaEmpresaConfig configForCurrentTenant() {
        return SistemaEmpresaConfig.findForTenant(tenantDataAccess.currentTenantId());
    }
}
