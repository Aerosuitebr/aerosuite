package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.domain.ConformidadeNaoConformidade.StatusNc;
import com.aerosuite.dto.OsConformidadeAlertasDto;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.security.InternalUserContext;
import com.aerosuite.security.TenantDataAccess;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Locale;

/**
 * D6 — Alertas de conformidade na OS (treinamento obrigatório, NC, calibração).
 */
@ApplicationScoped
public class OsConformidadeAlertaService {

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    InternalUserContext internalUser;

    @Inject
    ConformidadeEnforcementService enforcementService;

    public OsConformidadeAlertasDto alertasOs(Long osInternalId) {
        OS os = tenantDataAccess.requireOS(osInternalId);
        OsConformidadeAlertasDto dto = new OsConformidadeAlertasDto();
        dto.osId = os.id;
        dto.numeroOs = os.idOs;

        long ncOs = ConformidadeNaoConformidade.count("osId = ?1 and status <> ?2", os.id.intValue(), StatusNc.FECHADA);
        if (ncOs > 0) {
            dto.alertas.add(
                    ApiI18nMessages.encode(
                            "conformidade.os.alerta.nc_aberta",
                            java.util.Map.of("count", String.valueOf(ncOs))));
        }

        String perfil = internalUser.getPerfilCodigo();
        if (perfil != null && !perfil.isBlank()) {
            List<ConformidadeTreinamentoObrigatorio> requisitos =
                    ConformidadeTreinamentoObrigatorio.find(
                                    "ativo = true and upper(funcaoCodigo) = ?1",
                                    perfil.trim().toUpperCase(Locale.ROOT))
                            .list();
            for (ConformidadeTreinamentoObrigatorio req : requisitos) {
                if (!treinamentoValido(internalUser.getUserId(), req.curso, req.validadeMeses)) {
                    dto.alertas.add(
                            ApiI18nMessages.encode(
                                    "conformidade.os.alerta.treinamento_obrigatorio",
                                    java.util.Map.of(
                                            "curso", req.curso,
                                            "funcao", req.funcaoCodigo)));
                }
            }
        }

        long calibVencida = enforcementService.countCalibracaoVencida();
        if (calibVencida > 0) {
            dto.alertas.add(
                    ApiI18nMessages.encode(
                            "conformidade.os.alerta.calibracao_vencida",
                            java.util.Map.of("count", String.valueOf(calibVencida))));
        }

        dto.bloqueioMaterial = enforcementService.countAslNaoAprovado() > 0 || enforcementService.countAslVencido() > 0;
        return dto;
    }

    private boolean treinamentoValido(Integer usuarioId, String curso, Integer validadeMeses) {
        if (usuarioId == null || curso == null || curso.isBlank()) {
            return false;
        }
        ConformidadeTreinamento row =
                ConformidadeTreinamento.find(
                                "ativo = true and usuarioId = ?1 and lower(curso) = ?2 order by dataValidade desc",
                                usuarioId,
                                curso.trim().toLowerCase(Locale.ROOT))
                        .firstResult();
        if (row == null) {
            return false;
        }
        if (row.dataValidade != null) {
            return !row.dataValidade.isBefore(LocalDate.now());
        }
        if (row.dataConclusao != null && validadeMeses != null && validadeMeses > 0) {
            LocalDate limite = row.dataConclusao.plusMonths(validadeMeses);
            return !limite.isBefore(LocalDate.now());
        }
        return row.dataConclusao != null;
    }
}
