package com.aerosuite.integration;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.aerosuite.domain.ConformidadeCalibracaoFerramenta;
import com.aerosuite.domain.ConformidadeSubcontratacao;
import com.aerosuite.domain.ConformidadeSubcontratacao.StatusSubcontratacao;
import com.aerosuite.domain.ConformidadeTreinamentoObrigatorio;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.ConformidadeEnforcementConfigUpdateDto;
import com.aerosuite.service.ConformidadeEnforcementPolicyService;
import com.aerosuite.service.ConformidadeEnforcementService;
import io.quarkus.test.junit.QuarkusTest;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import java.time.LocalDate;
import org.junit.jupiter.api.Test;

/** P1 — bloqueios configuráveis calibração, treino obrigatório e subcontratação. */
@QuarkusTest
class ConformidadeEnforcementP1IT {

    @Inject
    ConformidadeEnforcementService enforcementService;

    @Inject
    ConformidadeEnforcementPolicyService policyService;

    @Test
    @Transactional
    void calibracaoVencida_comFlag_bloqueia() {
        ConformidadeEnforcementConfigUpdateDto cfg = new ConformidadeEnforcementConfigUpdateDto();
        cfg.bloquearCalibracaoVencida = true;
        policyService.updateConfig(cfg);

        ConformidadeCalibracaoFerramenta tool = new ConformidadeCalibracaoFerramenta();
        tool.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        tool.identificador = "TORQ-P1-IT";
        tool.descricao = "Torquímetro teste P1";
        tool.dataProximaCalibracao = LocalDate.now().minusDays(1);
        tool.ativo = true;
        tool.persist();

        IllegalStateException ex =
                assertThrows(
                        IllegalStateException.class,
                        () -> enforcementService.assertCalibracaoOperacionalPermitida(null));
        assertTrue(ex.getMessage().contains("conformidade.enforcement.calibracao_vencida"));
    }

    @Test
    @Transactional
    void subcontratacaoVencida_comFlag_bloqueiaOs() {
        ConformidadeEnforcementConfigUpdateDto cfg = new ConformidadeEnforcementConfigUpdateDto();
        cfg.bloquearSubcontratacaoVencida = true;
        policyService.updateConfig(cfg);

        ConformidadeSubcontratacao sub = new ConformidadeSubcontratacao();
        sub.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        sub.razaoSocial = "Subcontratada P1 IT";
        sub.certificadoPart145 = "BR.145.0001";
        sub.osId = 99991;
        sub.status = StatusSubcontratacao.ATIVO;
        sub.validadeCertificado = LocalDate.now().minusDays(10);
        sub.persist();

        IllegalStateException ex =
                assertThrows(
                        IllegalStateException.class,
                        () -> enforcementService.assertSubcontratacaoOsPermitida(99991));
        assertTrue(ex.getMessage().contains("conformidade.enforcement.subcontratacao_vencida"));
    }

    @Test
    @Transactional
    void treinoObrigatorio_comFlag_bloqueia() {
        ConformidadeEnforcementConfigUpdateDto cfg = new ConformidadeEnforcementConfigUpdateDto();
        cfg.bloquearTreinoObrigatorio = true;
        policyService.updateConfig(cfg);

        ConformidadeTreinamentoObrigatorio req = new ConformidadeTreinamentoObrigatorio();
        req.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        req.funcaoCodigo = "P145_EXECUCAO";
        req.curso = "Curso P1 IT Smoke";
        req.validadeMeses = 24;
        req.ativo = true;
        req.persist();

        IllegalStateException ex =
                assertThrows(
                        IllegalStateException.class,
                        () -> enforcementService.assertTreinamentoObrigatorioAtendido(1, "P145_EXECUCAO"));
        assertTrue(ex.getMessage().contains("conformidade.enforcement.treino_obrigatorio"));
    }

    @Test
    @Transactional
    void treinoObrigatorio_semFlag_permitido() {
        ConformidadeEnforcementConfigUpdateDto cfg = new ConformidadeEnforcementConfigUpdateDto();
        cfg.bloquearTreinoObrigatorio = false;
        policyService.updateConfig(cfg);

        ConformidadeTreinamentoObrigatorio req = new ConformidadeTreinamentoObrigatorio();
        req.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        req.funcaoCodigo = "P145_EXECUCAO";
        req.curso = "Curso P1 IT Off";
        req.validadeMeses = 24;
        req.ativo = true;
        req.persist();

        assertDoesNotThrow(
                () -> enforcementService.assertTreinamentoObrigatorioAtendido(1, "P145_EXECUCAO"));
    }

    @Test
    @Transactional
    void calibracaoVencida_semFlag_permitido() {
        ConformidadeEnforcementConfigUpdateDto cfg = new ConformidadeEnforcementConfigUpdateDto();
        cfg.bloquearCalibracaoVencida = false;
        policyService.updateConfig(cfg);

        ConformidadeCalibracaoFerramenta tool = new ConformidadeCalibracaoFerramenta();
        tool.tenantId = TenantConstants.DEFAULT_TENANT_ID_STR;
        tool.identificador = "TORQ-P1-OFF";
        tool.descricao = "Torquímetro off";
        tool.dataProximaCalibracao = LocalDate.now().minusDays(1);
        tool.ativo = true;
        tool.persist();

        assertDoesNotThrow(() -> enforcementService.assertCalibracaoOperacionalPermitida(null));
    }
}
