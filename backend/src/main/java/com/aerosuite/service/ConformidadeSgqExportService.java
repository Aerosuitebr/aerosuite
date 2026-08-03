package com.aerosuite.service;

import com.aerosuite.domain.*;
import com.aerosuite.domain.ConformidadeNaoConformidade.StatusNc;
import com.aerosuite.domain.SgqDocumentoControlado.StatusDocumento;
import com.aerosuite.dto.*;
import com.aerosuite.util.HtmlToPdfConverter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;

import com.fasterxml.jackson.databind.ObjectMapper;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

/**
 * D1 — Exportação SGQ para pacote ZIP / secção PDF do dossiê.
 */
@ApplicationScoped
public class ConformidadeSgqExportService {

    private static final DateTimeFormatter D = DateTimeFormatter.ISO_LOCAL_DATE;
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Inject
    SgqDocumentoService sgqDocumentoService;

    @Inject
    ConformidadeTreinamentoService treinamentoService;

    @Inject
    ConformidadeCalibracaoService calibracaoService;

    @Inject
    ConformidadeNaoConformidadeService ncService;

    public Map<String, Object> buildSnapshotJson(int diasJanela) {
        Map<String, Object> root = new LinkedHashMap<>();
        root.put("geradoEm", LocalDateTime.now().toString());
        root.put("diasJanela", diasJanela);
        root.put("documentos", sgqDocumentoService.alertas(diasJanela));
        root.put("treinamentos", treinamentoService.alertas(diasJanela));
        root.put("calibracao", calibracaoService.alertas(diasJanela));
        root.put("naoConformidades", listarNcAbertas());
        root.put("fornecedoresAsl", listarFornecedoresAsl());
        root.put("subcontratacao", listarSubcontratacao());
        return root;
    }

    public String buildSgqCsvResumo() {
        StringBuilder sb = new StringBuilder();
        sb.append("categoria;identificador;status;detalhe\n");
        List<SgqDocumentoControlado> docs =
                SgqDocumentoControlado.find("ativo = true order by codigo").list();
        for (SgqDocumentoControlado doc : docs) {
            sb.append("DOCUMENTO;")
                    .append(csv(doc.codigo))
                    .append(";")
                    .append(csv(doc.status != null ? doc.status.name() : ""))
                    .append(";")
                    .append(csv(doc.titulo))
                    .append("\n");
        }
        List<ConformidadeTreinamento> treinos =
                ConformidadeTreinamento.find("ativo = true order by usuarioId, curso").list();
        for (ConformidadeTreinamento t : treinos) {
            sb.append("TREINAMENTO;")
                    .append(csv(String.valueOf(t.usuarioId)))
                    .append(";")
                    .append(csv(t.curso))
                    .append(";")
                    .append(csv(t.dataValidade != null ? t.dataValidade.format(D) : ""))
                    .append("\n");
        }
        List<ConformidadeCalibracaoFerramenta> calibs =
                ConformidadeCalibracaoFerramenta.find("ativo = true order by identificador").list();
        for (ConformidadeCalibracaoFerramenta c : calibs) {
            sb.append("CALIBRACAO;")
                    .append(csv(c.identificador))
                    .append(";")
                    .append(csv(c.descricao))
                    .append(";")
                    .append(csv(c.dataProximaCalibracao != null ? c.dataProximaCalibracao.format(D) : ""))
                    .append("\n");
        }
        List<ConformidadeNaoConformidade> ncs =
                ConformidadeNaoConformidade.find("status <> ?1 order by dataAbertura desc", StatusNc.FECHADA)
                        .list();
        for (ConformidadeNaoConformidade nc : ncs) {
            sb.append("NC;")
                    .append(csv(nc.numero))
                    .append(";")
                    .append(csv(nc.status != null ? nc.status.name() : ""))
                    .append(";")
                    .append(csv(nc.titulo))
                    .append("\n");
        }
        List<Fornecedor> fornecedores = Fornecedor.find("order by razaoSocial").page(0, 40).list();
        for (Fornecedor f : fornecedores) {
            sb.append("ASL;")
                    .append(csv(f.razaoSocial))
                    .append(";")
                    .append(csv(f.aslStatus))
                    .append(";")
                    .append(csv(f.aslValidade != null ? f.aslValidade.format(D) : ""))
                    .append("\n");
        }
        return sb.toString();
    }

    public String buildNcCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("numero;titulo;severidade;status;capa_fase;data_abertura;data_fechamento;os_id_interno;os_numero\n");
        List<ConformidadeNaoConformidade> ncs =
                ConformidadeNaoConformidade.find("order by dataAbertura desc").list();
        for (ConformidadeNaoConformidade nc : ncs) {
            Integer osNumero = null;
            if (nc.osId != null) {
                OS os = OS.findById(nc.osId.longValue());
                if (os != null) {
                    osNumero = os.idOs;
                }
            }
            sb.append(csv(nc.numero))
                    .append(";")
                    .append(csv(nc.titulo))
                    .append(";")
                    .append(csv(nc.severidade != null ? nc.severidade.name() : ""))
                    .append(";")
                    .append(csv(nc.status != null ? nc.status.name() : ""))
                    .append(";")
                    .append(csv(nc.capaFase != null ? nc.capaFase.name() : ""))
                    .append(";")
                    .append(csv(nc.dataAbertura != null ? nc.dataAbertura.format(D) : ""))
                    .append(";")
                    .append(csv(nc.dataFechamento != null ? nc.dataFechamento.format(D) : ""))
                    .append(";")
                    .append(nc.osId != null ? nc.osId : "")
                    .append(";")
                    .append(osNumero != null ? osNumero : "")
                    .append("\n");
        }
        return sb.toString();
    }

    public String buildDocumentosCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("codigo;titulo;revisao;status;data_vigencia;tipo\n");
        List<SgqDocumentoControlado> docs =
                SgqDocumentoControlado.find("ativo = true order by codigo").list();
        for (SgqDocumentoControlado doc : docs) {
            sb.append(csv(doc.codigo))
                    .append(";")
                    .append(csv(doc.titulo))
                    .append(";")
                    .append(csv(doc.revisao))
                    .append(";")
                    .append(csv(doc.status != null ? doc.status.name() : ""))
                    .append(";")
                    .append(csv(doc.dataVigencia != null ? doc.dataVigencia.format(D) : ""))
                    .append(";")
                    .append(csv(doc.tipo != null ? doc.tipo.name() : ""))
                    .append("\n");
        }
        return sb.toString();
    }

    public String buildTreinamentosCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("usuario_id;curso;data_conclusao;data_validade;carga_horaria;certificador\n");
        List<ConformidadeTreinamento> treinos =
                ConformidadeTreinamento.find("ativo = true order by usuarioId, curso").list();
        for (ConformidadeTreinamento t : treinos) {
            sb.append(t.usuarioId != null ? t.usuarioId : "")
                    .append(";")
                    .append(csv(t.curso))
                    .append(";")
                    .append(csv(t.dataConclusao != null ? t.dataConclusao.format(D) : ""))
                    .append(";")
                    .append(csv(t.dataValidade != null ? t.dataValidade.format(D) : ""))
                    .append(";")
                    .append(t.cargaHoraria != null ? t.cargaHoraria : "")
                    .append(";")
                    .append(csv(t.certificador))
                    .append("\n");
        }
        return sb.toString();
    }

    public String buildCalibracaoCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("identificador;descricao;tipo;localizacao;ultima_calibracao;proxima_calibracao;certificado\n");
        List<ConformidadeCalibracaoFerramenta> calibs =
                ConformidadeCalibracaoFerramenta.find("ativo = true order by identificador").list();
        for (ConformidadeCalibracaoFerramenta c : calibs) {
            sb.append(csv(c.identificador))
                    .append(";")
                    .append(csv(c.descricao))
                    .append(";")
                    .append(csv(c.tipo != null ? c.tipo.name() : ""))
                    .append(";")
                    .append(csv(c.localizacao))
                    .append(";")
                    .append(csv(c.dataUltimaCalibracao != null ? c.dataUltimaCalibracao.format(D) : ""))
                    .append(";")
                    .append(csv(c.dataProximaCalibracao != null ? c.dataProximaCalibracao.format(D) : ""))
                    .append(";")
                    .append(csv(c.certificadoRef))
                    .append("\n");
        }
        return sb.toString();
    }

    public String buildSubcontratacaoCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("razao_social;certificado_part145;validade;status;escopo\n");
        List<ConformidadeSubcontratacao> subs =
                ConformidadeSubcontratacao.find("order by razaoSocial").list();
        for (ConformidadeSubcontratacao s : subs) {
            sb.append(csv(s.razaoSocial))
                    .append(";")
                    .append(csv(s.certificadoPart145))
                    .append(";")
                    .append(csv(s.validadeCertificado != null ? s.validadeCertificado.format(D) : ""))
                    .append(";")
                    .append(csv(s.status != null ? s.status.name() : ""))
                    .append(";")
                    .append(csv(s.escopo))
                    .append("\n");
        }
        return sb.toString();
    }

    public String buildAslCsv() {
        StringBuilder sb = new StringBuilder();
        sb.append("razao_social;asl_status;asl_validade;asl_escopo\n");
        List<Fornecedor> fornecedores = Fornecedor.find("order by razaoSocial").list();
        for (Fornecedor f : fornecedores) {
            sb.append(csv(f.razaoSocial))
                    .append(";")
                    .append(csv(f.aslStatus))
                    .append(";")
                    .append(csv(f.aslValidade != null ? f.aslValidade.format(D) : ""))
                    .append(";")
                    .append(csv(f.aslEscopo))
                    .append("\n");
        }
        return sb.toString();
    }

    public byte[] buildRelatorioSgqZip(int diasJanela) throws Exception {
        int janela = Math.min(Math.max(diasJanela, 1), 365);
        ObjectMapper json = new ObjectMapper();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(baos)) {
            putZipText(zip, "README.txt", buildRelatorioReadme(janela));
            putZipText(zip, "resumo.csv", buildSgqCsvResumo());
            putZipText(zip, "nao_conformidades.csv", buildNcCsv());
            putZipText(zip, "documentos.csv", buildDocumentosCsv());
            putZipText(zip, "treinamentos.csv", buildTreinamentosCsv());
            putZipText(zip, "calibracao.csv", buildCalibracaoCsv());
            putZipText(zip, "subcontratacao.csv", buildSubcontratacaoCsv());
            putZipText(zip, "asl.csv", buildAslCsv());
            Map<String, Object> snapshot = buildSnapshotJson(janela);
            putZipText(
                    zip,
                    "snapshot.json",
                    json.writerWithDefaultPrettyPrinter().writeValueAsString(snapshot));
        }
        return baos.toByteArray();
    }

    public String suggestedRelatorioZipName() {
        return "Relatorio_SGQ_" + LocalDate.now().format(D) + ".zip";
    }

    private static String buildRelatorioReadme(int diasJanela) {
        return """
                Aero Suite — Relatório SGQ exportável (P5.4)
                Gerado em: %s
                Janela de alertas (dias): %d

                Arquivos:
                  resumo.csv — visão consolidada por categoria
                  nao_conformidades.csv — NC/CAPA completas
                  documentos.csv — documentos controlados ativos
                  treinamentos.csv — registros de treinamento
                  calibracao.csv — ferramentas/instrumentos
                  subcontratacao.csv — subcontratados Part 145
                  asl.csv — fornecedores (Approved Supplier List)
                  snapshot.json — instantâneo estruturado (alertas + listas)
                """
                .formatted(LocalDateTime.now().format(DT), diasJanela);
    }

    private static void putZipText(ZipOutputStream zip, String path, String content) throws Exception {
        zip.putNextEntry(new ZipEntry(path));
        zip.write(content.getBytes(StandardCharsets.UTF_8));
        zip.closeEntry();
    }

    public String buildSgqHtmlSection(String locale) {
        SgqExportLabels labels = SgqExportLabels.forLocale(locale);
        LocalDate hoje = LocalDate.now();
        StringBuilder html = new StringBuilder();
        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionSgq())).append("</h2>");

        List<ConformidadeNaoConformidade> ncRows =
                ConformidadeNaoConformidade.find("status <> ?1 order by dataAbertura desc", StatusNc.FECHADA)
                        .page(0, 30)
                        .list();
        appendTable(
                html,
                labels.colNc(),
                ncRows,
                nc -> nc.numero + " — " + nvl(nc.titulo, ""));

        List<SgqDocumentoControlado> docRows =
                SgqDocumentoControlado.find("ativo = true and status = ?1 order by codigo", StatusDocumento.VIGENTE)
                        .page(0, 40)
                        .list();
        appendTable(
                html,
                labels.colDocs(),
                docRows,
                d -> d.codigo + " rev." + nvl(d.revisao, "00") + " — " + nvl(d.titulo, ""));

        List<ConformidadeTreinamento> treinoRows =
                ConformidadeTreinamento.find("ativo = true order by dataValidade asc").page(0, 40).list();
        appendTable(
                html,
                labels.colTreinos(),
                treinoRows,
                t -> "user#" + t.usuarioId + " — " + nvl(t.curso, "")
                        + (t.dataValidade != null ? " (" + t.dataValidade + ")" : ""));

        List<ConformidadeCalibracaoFerramenta> calibRows =
                ConformidadeCalibracaoFerramenta.find("ativo = true order by dataProximaCalibracao asc")
                        .page(0, 40)
                        .list();
        appendTable(
                html,
                labels.colCalib(),
                calibRows,
                c -> nvl(c.identificador, "") + " — " + nvl(c.descricao, "")
                        + (c.dataProximaCalibracao != null ? " (" + c.dataProximaCalibracao + ")" : ""));

        List<Fornecedor> aslRows = Fornecedor.find("order by razaoSocial").page(0, 40).list();
        appendTable(
                html,
                labels.colAsl(),
                aslRows,
                f -> nvl(f.razaoSocial, "") + " — " + nvl(f.aslStatus, "PENDENTE")
                        + (f.aslValidade != null ? " (" + f.aslValidade + ")" : ""));

        html.append("<p class=\"meta\">")
                .append(HtmlToPdfConverter.escapeHtml(labels.geradoEm()))
                .append(": ")
                .append(HtmlToPdfConverter.escapeHtml(LocalDateTime.now().format(DT)))
                .append(" — ")
                .append(HtmlToPdfConverter.escapeHtml(labels.refData()))
                .append(" ")
                .append(HtmlToPdfConverter.escapeHtml(hoje.format(D)))
                .append("</p>");
        return html.toString();
    }

    private <T> void appendTable(StringBuilder html, String title, List<T> rows, java.util.function.Function<T, String> line) {
        html.append("<h3>").append(HtmlToPdfConverter.escapeHtml(title)).append("</h3>");
        if (rows.isEmpty()) {
            html.append("<p>—</p>");
            return;
        }
        html.append("<ul>");
        for (T row : rows) {
            html.append("<li>").append(HtmlToPdfConverter.escapeHtml(line.apply(row))).append("</li>");
        }
        html.append("</ul>");
    }

    private List<ConformidadeNaoConformidadeDto> listarNcAbertas() {
        List<ConformidadeNaoConformidadeDto> out = new ArrayList<>();
        List<ConformidadeNaoConformidade> ncs =
                ConformidadeNaoConformidade.find("status <> ?1 order by dataAbertura desc", StatusNc.FECHADA)
                        .page(0, 100)
                        .list();
        for (ConformidadeNaoConformidade nc : ncs) {
            ConformidadeNaoConformidadeDto dto = new ConformidadeNaoConformidadeDto();
            dto.numero = nc.numero;
            dto.titulo = nc.titulo;
            dto.status = nc.status != null ? nc.status.name() : null;
            dto.severidade = nc.severidade != null ? nc.severidade.name() : null;
            out.add(dto);
        }
        return out;
    }

    private List<Map<String, Object>> listarFornecedoresAsl() {
        List<Map<String, Object>> out = new ArrayList<>();
        List<Fornecedor> fornecedores = Fornecedor.find("order by razaoSocial").page(0, 200).list();
        for (Fornecedor f : fornecedores) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("id", f.id);
            row.put("nome", f.razaoSocial);
            row.put("aslStatus", f.aslStatus);
            row.put("aslEscopo", f.aslEscopo);
            row.put("aslValidade", f.aslValidade != null ? f.aslValidade.toString() : null);
            out.add(row);
        }
        return out;
    }

    private List<Map<String, Object>> listarSubcontratacao() {
        List<Map<String, Object>> out = new ArrayList<>();
        List<ConformidadeSubcontratacao> subs =
                ConformidadeSubcontratacao.find("status = ?1 order by razaoSocial", ConformidadeSubcontratacao.StatusSubcontratacao.ATIVO)
                        .page(0, 100)
                        .list();
        for (ConformidadeSubcontratacao s : subs) {
            Map<String, Object> row = new LinkedHashMap<>();
            row.put("nome", s.razaoSocial);
            row.put("certificado", s.certificadoPart145);
            row.put("validade", s.validadeCertificado != null ? s.validadeCertificado.toString() : null);
            out.add(row);
        }
        return out;
    }

    private static String csv(String v) {
        if (v == null) {
            return "";
        }
        return v.replace(";", ",").replace("\n", " ");
    }

    private static String nvl(String a, String b) {
        return a != null && !a.isBlank() ? a : b;
    }

    private static final class SgqExportLabels {
        private final String sectionSgq;
        private final String colNc;
        private final String colDocs;
        private final String colTreinos;
        private final String colCalib;
        private final String colAsl;
        private final String geradoEm;
        private final String refData;

        private SgqExportLabels(
                String sectionSgq,
                String colNc,
                String colDocs,
                String colTreinos,
                String colCalib,
                String colAsl,
                String geradoEm,
                String refData) {
            this.sectionSgq = sectionSgq;
            this.colNc = colNc;
            this.colDocs = colDocs;
            this.colTreinos = colTreinos;
            this.colCalib = colCalib;
            this.colAsl = colAsl;
            this.geradoEm = geradoEm;
            this.refData = refData;
        }

        static SgqExportLabels forLocale(String locale) {
            String key = locale != null ? locale.toLowerCase(Locale.ROOT) : "pt-br";
            if (key.startsWith("en")) {
                return new SgqExportLabels(
                        "Quality system (SGQ) snapshot",
                        "Open non-conformities",
                        "Controlled documents (current)",
                        "Training records",
                        "Calibration / tools",
                        "Approved supplier list (ASL)",
                        "Generated at",
                        "Reference date");
            }
            if (key.startsWith("es")) {
                return new SgqExportLabels(
                        "Instantánea SGQ",
                        "No conformidades abiertas",
                        "Documentos controlados (vigentes)",
                        "Registros de formación",
                        "Calibración / herramientas",
                        "Lista de proveedores aprobados (ASL)",
                        "Generado en",
                        "Fecha de referencia");
            }
            if (key.startsWith("fr")) {
                return new SgqExportLabels(
                        "Instantané SGQ",
                        "Non-conformités ouvertes",
                        "Documents maîtrisés (en vigueur)",
                        "Formations enregistrées",
                        "Étalonnage / outils",
                        "Liste fournisseurs approuvés (ASL)",
                        "Généré le",
                        "Date de référence");
            }
            return new SgqExportLabels(
                    "Bloco SGQ (sistema da qualidade)",
                    "Não conformidades abertas",
                    "Documentos controlados (vigentes)",
                    "Registros de treinamento",
                    "Calibração / ferramentas",
                    "Lista de fornecedores aprovados (ASL)",
                    "Gerado em",
                    "Data de referência");
        }

        String sectionSgq() {
            return sectionSgq;
        }

        String colNc() {
            return colNc;
        }

        String colDocs() {
            return colDocs;
        }

        String colTreinos() {
            return colTreinos;
        }

        String colCalib() {
            return colCalib;
        }

        String colAsl() {
            return colAsl;
        }

        String geradoEm() {
            return geradoEm;
        }

        String refData() {
            return refData;
        }
    }
}
