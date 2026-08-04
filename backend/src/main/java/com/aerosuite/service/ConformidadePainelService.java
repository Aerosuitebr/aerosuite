package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeSubcontratacao;
import com.aerosuite.domain.Fornecedor;
import com.aerosuite.dto.*;
import com.aerosuite.util.DisplayTextRepair;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import java.time.LocalDate;
import java.util.List;

/**
 * D2 — Painel consolidado de alertas SGQ.
 */
@ApplicationScoped
public class ConformidadePainelService {

    @Inject
    SgqDocumentoService sgqDocumentoService;

    @Inject
    ConformidadeTreinamentoService treinamentoService;

    @Inject
    ConformidadeCalibracaoService calibracaoService;

    @Inject
    ConformidadeEnforcementService enforcementService;

    public ConformidadePainelDto painel(int diasJanela) {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        ConformidadePainelDto dto = new ConformidadePainelDto();
        dto.diasJanela = janela;

        ConformidadeAlertasResumoDto docs = sgqDocumentoService.alertas(janela);
        dto.totalDocumentosVencidos = (int) docs.totalVencidas;
        dto.totalDocumentosProximos = (int) docs.totalProximas;
        addItens(dto, "DOCUMENTO", docs.itens, "/conformidade/documentos");

        ConformidadeAlertasResumoDto treinos = treinamentoService.alertas(janela);
        dto.totalTreinamentosVencidos = (int) treinos.totalVencidas;
        dto.totalTreinamentosProximos = (int) treinos.totalProximas;
        addItens(dto, "TREINAMENTO", treinos.itens, "/conformidade/treinamentos");

        ConformidadeAlertasResumoDto calib = calibracaoService.alertas(janela);
        dto.totalCalibracaoVencida = (int) calib.totalVencidas;
        dto.totalCalibracaoProxima = (int) calib.totalProximas;
        addItens(dto, "CALIBRACAO", calib.itens, "/conformidade/calibracao");

        dto.totalNcAbertas = (int) enforcementService.countNcAbertas();
        dto.totalAslPendente = (int) enforcementService.countAslNaoAprovado();
        dto.totalAslVencido = (int) enforcementService.countAslVencido();

        List<Fornecedor> aslPendentes =
                Fornecedor.find("(aslStatus is null or upper(aslStatus) <> 'APROVADO') order by razaoSocial")
                        .page(0, 50)
                        .list();
        for (Fornecedor f : aslPendentes) {
            ConformidadePainelItemDto item = new ConformidadePainelItemDto();
            item.categoria = "ASL";
            item.severidade = "ALTA";
            item.titulo = DisplayTextRepair.repair(f.razaoSocial);
            item.detalhe = f.aslStatus != null ? f.aslStatus : "PENDENTE";
            item.rota = "/estoque/fornecedores";
            item.referenciaId = f.id;
            dto.itens.add(item);
        }
        List<Fornecedor> aslVencidos =
                Fornecedor.find(
                                "upper(aslStatus) = 'APROVADO' and aslValidade is not null and aslValidade < ?1 order by razaoSocial",
                                LocalDate.now())
                        .page(0, 50)
                        .list();
        for (Fornecedor f : aslVencidos) {
            ConformidadePainelItemDto item = new ConformidadePainelItemDto();
            item.categoria = "ASL";
            item.severidade = "CRITICA";
            item.titulo = DisplayTextRepair.repair(f.razaoSocial);
            item.detalhe = "ASL vencido: " + f.aslValidade;
            item.rota = "/estoque/fornecedores";
            item.referenciaId = f.id;
            dto.itens.add(item);
        }

        LocalDate limite = LocalDate.now().plusDays(janela);
        List<ConformidadeSubcontratacao> subAlertas =
                ConformidadeSubcontratacao.find(
                                "status = ?1 and validadeCertificado is not null and validadeCertificado <= ?2 order by validadeCertificado",
                                ConformidadeSubcontratacao.StatusSubcontratacao.ATIVO,
                                limite)
                        .page(0, 30)
                        .list();
        for (ConformidadeSubcontratacao s : subAlertas) {
            dto.totalSubcontratacaoAlerta++;
            ConformidadePainelItemDto item = new ConformidadePainelItemDto();
            item.categoria = "SUBCONTRATACAO";
            item.severidade =
                    s.validadeCertificado != null && s.validadeCertificado.isBefore(LocalDate.now()) ? "VENCIDA" : "PROXIMA";
            item.titulo = DisplayTextRepair.repair(s.razaoSocial);
            item.detalhe = s.validadeCertificado != null ? s.validadeCertificado.toString() : "";
            item.rota = "/conformidade/subcontratacao";
            item.referenciaId = s.id;
            dto.itens.add(item);
        }

        return dto;
    }

    private void addItens(ConformidadePainelDto dto, String categoria, java.util.List<Object> itens, String rota) {
        if (itens == null) {
            return;
        }
        for (Object raw : itens) {
            ConformidadePainelItemDto item = new ConformidadePainelItemDto();
            item.categoria = categoria;
            item.rota = rota;
            if (raw instanceof SgqDocumentoDto doc) {
                item.severidade = doc.severidadeAlerta;
                item.titulo = DisplayTextRepair.repair(doc.codigo + " — " + doc.titulo);
                item.detalhe = doc.dataVigencia;
                item.referenciaId = doc.id;
            } else if (raw instanceof ConformidadeTreinamentoDto treino) {
                item.severidade = treino.severidadeAlerta;
                item.titulo = DisplayTextRepair.repair(treino.curso);
                item.detalhe = treino.dataValidade;
                item.referenciaId = treino.id;
            } else if (raw instanceof ConformidadeCalibracaoDto cal) {
                item.severidade = cal.severidadeAlerta;
                item.titulo = DisplayTextRepair.repair(cal.identificador + " — " + cal.descricao);
                item.detalhe = cal.dataProximaCalibracao;
                item.referenciaId = cal.id;
            } else {
                item.titulo = String.valueOf(raw);
            }
            dto.itens.add(item);
        }
    }
}
