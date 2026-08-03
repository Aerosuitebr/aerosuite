package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.domain.ConformidadeNaoConformidade.StatusNc;
import com.aerosuite.domain.ConformidadeSubcontratacao.StatusSubcontratacao;
import com.aerosuite.i18n.ApiI18nMessages;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;

/**
 * D3/P1 — Bloqueio operacional ASL, calibração, treino obrigatório e subcontratação.
 */
@ApplicationScoped
public class ConformidadeEnforcementService {

    @Inject
    ConformidadeEnforcementPolicyService policyService;

    public void assertFornecedorAslAprovado(Fornecedor fornecedor) {
        if (fornecedor == null) {
            return;
        }
        String status = fornecedor.aslStatus != null ? fornecedor.aslStatus.trim().toUpperCase(Locale.ROOT) : "";
        if (!"APROVADO".equals(status)) {
            throw new IllegalStateException(
                    ApiI18nMessages.encode(
                            "conformidade.enforcement.asl_nao_aprovado",
                            "fornecedor",
                            nvl(fornecedor.razaoSocial, String.valueOf(fornecedor.id))));
        }
        if (fornecedor.aslValidade != null && fornecedor.aslValidade.isBefore(LocalDate.now())) {
            throw new IllegalStateException(
                    ApiI18nMessages.encode(
                            "conformidade.enforcement.asl_vencido",
                            Map.of(
                                    "fornecedor",
                                    nvl(fornecedor.razaoSocial, String.valueOf(fornecedor.id)),
                                    "validade",
                                    fornecedor.aslValidade.toString())));
        }
    }

    /** P1 — bloqueia saída/apontamento quando há ferramentas com calibração vencida. */
    public void assertCalibracaoOperacionalPermitida(String ferramentaIdentificador) {
        if (!policyService.bloquearCalibracaoVencida()) {
            return;
        }
        if (ferramentaIdentificador != null && !ferramentaIdentificador.isBlank()) {
            assertFerramentaCalibrada(ferramentaIdentificador.trim());
            return;
        }
        long vencidas = countCalibracaoVencida();
        if (vencidas > 0) {
            throw new IllegalStateException(
                    ApiI18nMessages.encode(
                            "conformidade.enforcement.calibracao_vencida",
                            "count",
                            String.valueOf(vencidas)));
        }
    }

    public void assertFerramentaCalibrada(String identificador) {
        if (identificador == null || identificador.isBlank()) {
            return;
        }
        if (ferramentaCalibracaoVencida(identificador)) {
            throw new IllegalStateException(
                    ApiI18nMessages.encode(
                            "conformidade.enforcement.calibracao_ferramenta_vencida",
                            "ferramenta",
                            identificador.trim()));
        }
    }

    public void assertTreinamentoObrigatorioAtendido(Integer usuarioId, String perfilCodigo) {
        if (!policyService.bloquearTreinoObrigatorio()) {
            return;
        }
        if (perfilCodigo == null || perfilCodigo.isBlank()) {
            return;
        }
        List<ConformidadeTreinamentoObrigatorio> requisitos =
                ConformidadeTreinamentoObrigatorio.find(
                                "ativo = true and upper(funcaoCodigo) = ?1",
                                perfilCodigo.trim().toUpperCase(Locale.ROOT))
                        .list();
        for (ConformidadeTreinamentoObrigatorio req : requisitos) {
            if (!treinamentoValido(usuarioId, req.curso, req.validadeMeses)) {
                throw new IllegalStateException(
                        ApiI18nMessages.encode(
                                "conformidade.enforcement.treino_obrigatorio",
                                Map.of(
                                        "curso", req.curso,
                                        "funcao", req.funcaoCodigo)));
            }
        }
    }

    /** P1 — bloqueia operações na OS com subcontratação ativa e certificado vencido. */
    public void assertSubcontratacaoOsPermitida(Integer osNumero) {
        if (!policyService.bloquearSubcontratacaoVencida() || osNumero == null) {
            return;
        }
        List<ConformidadeSubcontratacao> rows =
                ConformidadeSubcontratacao.find(
                                "osId = ?1 and status = ?2 and validadeCertificado is not null and validadeCertificado < ?3",
                                osNumero,
                                StatusSubcontratacao.ATIVO,
                                LocalDate.now())
                        .list();
        if (rows.isEmpty()) {
            return;
        }
        ConformidadeSubcontratacao s = rows.get(0);
        throw new IllegalStateException(
                ApiI18nMessages.encode(
                        "conformidade.enforcement.subcontratacao_vencida",
                        Map.of(
                                "subcontratado",
                                nvl(s.razaoSocial, String.valueOf(s.id)),
                                "validade",
                                s.validadeCertificado.toString())));
    }

    public void assertOperacaoOsConformidade(
            Integer osNumero, Long usuarioId, String perfilCodigo, String ferramentaIdentificador) {
        assertSubcontratacaoOsPermitida(osNumero);
        assertTreinamentoObrigatorioAtendido(toUserIdInt(usuarioId), perfilCodigo);
        assertCalibracaoOperacionalPermitida(ferramentaIdentificador);
    }

    private static Integer toUserIdInt(Long userId) {
        return userId != null ? userId.intValue() : null;
    }

    public boolean ferramentaCalibracaoVencida(String identificador) {
        if (identificador == null || identificador.isBlank()) {
            return false;
        }
        ConformidadeCalibracaoFerramenta tool =
                ConformidadeCalibracaoFerramenta.find(
                                "ativo = true and identificador = ?1", identificador.trim())
                        .firstResult();
        if (tool == null || tool.dataProximaCalibracao == null) {
            return false;
        }
        return !tool.dataProximaCalibracao.isAfter(LocalDate.now());
    }

    public long countCalibracaoVencida() {
        return ConformidadeCalibracaoFerramenta.count(
                "ativo = true and dataProximaCalibracao is not null and dataProximaCalibracao < ?1",
                LocalDate.now());
    }

    public long countAslNaoAprovado() {
        return Fornecedor.count("(aslStatus is null or upper(aslStatus) <> 'APROVADO')");
    }

    public long countAslVencido() {
        return Fornecedor.count(
                "upper(aslStatus) = 'APROVADO' and aslValidade is not null and aslValidade < ?1",
                LocalDate.now());
    }

    public long countNcAbertas() {
        return ConformidadeNaoConformidade.count("status <> ?1", StatusNc.FECHADA);
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

    private static String nvl(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }
}
