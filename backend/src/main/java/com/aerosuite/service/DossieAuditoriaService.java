package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.domain.AcessoAuditoria;
import com.aerosuite.domain.ItemEstoque;
import com.aerosuite.domain.LogAcessoExterno;
import com.aerosuite.domain.MovimentacaoEstoque;
import com.aerosuite.domain.OS;
import com.aerosuite.dossie.DossieAuditoriaLabels;
import com.aerosuite.dto.DossieAuditoriaResumoDto;
import com.aerosuite.dto.OSAuditoriaDto;
import com.aerosuite.dto.OSFileDto;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.HtmlToPdfConverter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.persistence.EntityManager;
import jakarta.ws.rs.BadRequestException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class DossieAuditoriaService {

    private static final int MAX_OS_AUDIT = 500;
    private static final int MAX_ACCESS_LOG = 80;
    private static final int MAX_EXTERNAL_LOG = 200;

    private static final DateTimeFormatter DT =
            DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    OSAuditoriaService osAuditoriaService;

    @Inject
    OSFileService osFileService;

    @Inject
    HtmlToPdfConverter htmlToPdfConverter;

    @Inject
    EntityManager entityManager;

    @Inject
    ConformidadeSgqExportService sgqExportService;

    public DossieAuditoriaResumoDto resumo(Long osInternalId, Integer numeroOs) {
        OS os = resolveOs(osInternalId, numeroOs);
        DossieAuditoriaResumoDto dto = new DossieAuditoriaResumoDto();
        dto.osId = os.id;
        dto.numeroOs = os.idOs;
        dto.totalAnexos = osFileService.getFilesByOSId(os.id).size();
        dto.totalMovimentosEstoque = listMovimentos(os).size();
        dto.totalAuditoriaOs = osAuditoriaService.buscarHistoricoPorOs(os.id).size();
        dto.totalAcessoExterno = listAcessoExterno(os).size();
        dto.totalAcessoInterno = listAcessoInterno().size();
        return dto;
    }

    public byte[] exportPdf(Long osInternalId, Integer numeroOs, String locale) throws Exception {
        OS os = resolveOs(osInternalId, numeroOs);
        DossieAuditoriaLabels labels = DossieAuditoriaLabels.forLocale(locale);
        String html = buildHtml(os, labels, locale);
        return htmlToPdfConverter.toPdf(html);
    }

    public String suggestedFileName(OS os) {
        return "Dossie_OS_" + os.idOs + ".pdf";
    }

    private OS resolveOs(Long osInternalId, Integer numeroOs) {
        if (osInternalId != null) {
            return tenantDataAccess.requireOS(osInternalId);
        }
        if (numeroOs != null) {
            return tenantDataAccess.requireOSByIdOs(numeroOs);
        }
        throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.DOSSIE_ID_OR_OS_REQUIRED));
    }

    private List<MovimentacaoEstoque> listMovimentos(OS os) {
        List<MovimentacaoEstoque> byInternal =
                MovimentacaoEstoque.list("osId = ?1 order by dataMovimentacao desc", os.id);
        if (!byInternal.isEmpty()) {
            return byInternal;
        }
        return MovimentacaoEstoque.list("osId = ?1 order by dataMovimentacao desc", os.idOs.longValue());
    }

    private List<LogAcessoExterno> listAcessoExterno(OS os) {
        return entityManager
                .createQuery(
                        "SELECT l FROM LogAcessoExterno l JOIN FETCH l.usuarioExterno "
                                + "WHERE l.recursoId = :rid AND l.recursoTipo = :rt ORDER BY l.dataAcesso DESC",
                        LogAcessoExterno.class)
                .setParameter("rid", os.id)
                .setParameter("rt", "OS")
                .setMaxResults(MAX_EXTERNAL_LOG)
                .getResultList();
    }

    private List<AcessoAuditoria> listAcessoInterno() {
        long tenantId = tenantDataAccess.currentTenantId();
        return AcessoAuditoria.find("tenantId = ?1 order by createdAt desc", tenantId)
                .page(0, MAX_ACCESS_LOG)
                .list();
    }

    private String buildHtml(OS os, DossieAuditoriaLabels labels, String locale) {
        List<OSFileDto> files = osFileService.getFilesByOSId(os.id);
        List<MovimentacaoEstoque> movs = listMovimentos(os);
        List<OSAuditoriaDto> audit = osAuditoriaService.buscarHistoricoPorOs(os.id);
        if (audit.size() > MAX_OS_AUDIT) {
            audit = audit.subList(0, MAX_OS_AUDIT);
        }
        List<LogAcessoExterno> ext = listAcessoExterno(os);
        List<AcessoAuditoria> acc = listAcessoInterno();

        Map<String, String> fieldLabels = DossieAuditoriaLabels.osFieldLabels(locale);
        String generated = LocalDateTime.now().format(DT);

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><style>");
        html.append("body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#222;margin:24px;}");
        html.append("h1{font-size:16pt;margin:0 0 4px;} h2{font-size:12pt;margin:24px 0 8px;border-bottom:1px solid #ccc;}");
        html.append("table{width:100%;border-collapse:collapse;margin-bottom:12px;} ");
        html.append("th,td{border:1px solid #ddd;padding:4px 6px;text-align:left;vertical-align:top;} ");
        html.append("th{background:#f5f5f5;font-size:9pt;} td{font-size:9pt;} ");
        html.append(".meta{color:#666;font-size:9pt;margin-bottom:16px;} ");
        html.append(".kv td:first-child{font-weight:bold;width:28%;background:#fafafa;}");
        html.append("</style></head><body>");

        html.append("<h1>").append(HtmlToPdfConverter.escapeHtml(labels.title())).append(" #");
        html.append(HtmlToPdfConverter.escapeHtml(String.valueOf(os.idOs))).append("</h1>");
        html.append("<p class=\"meta\">")
                .append(HtmlToPdfConverter.escapeHtml(labels.generatedAt()))
                .append(": ")
                .append(HtmlToPdfConverter.escapeHtml(generated))
                .append(" — ")
                .append(HtmlToPdfConverter.escapeHtml(DossieAuditoriaLabels.formatOsRef(os.idOs, os.id)))
                .append("</p>");

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionChecklist())).append("</h2>");
        html.append("<ul>");
        for (String line : DossieAuditoriaLabels.checklistLines(locale)) {
            html.append("<li>").append(HtmlToPdfConverter.escapeHtml(line)).append("</li>");
        }
        html.append("</ul>");

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionOs())).append("</h2>");
        html.append("<table class=\"kv\">");
        appendKv(html, fieldLabels.get("clienteNome"), os.clienteNome);
        appendKv(html, fieldLabels.get("tipoServico"), os.tipoServico);
        appendKv(html, fieldLabels.get("partNumber"), os.partNumber);
        appendKv(html, fieldLabels.get("serialNumber"), os.serialNumber);
        appendKv(html, fieldLabels.get("marcasMatricula"), os.marcasMatricula);
        appendKv(html, fieldLabels.get("dtAbertura"), os.dtAbertura != null ? os.dtAbertura.toString() : null);
        appendKv(html, fieldLabels.get("dataFechamento"), os.dataFechamento != null ? os.dataFechamento.toString() : null);
        appendKv(
                html,
                fieldLabels.get("status"),
                Boolean.FALSE.equals(os.isActive) ? "false" : "true");
        html.append("</table>");

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionFiles())).append("</h2>");
        if (files.isEmpty()) {
            html.append("<p>").append(HtmlToPdfConverter.escapeHtml(labels.noRecords())).append("</p>");
        } else {
            html.append("<table><tr><th>").append(HtmlToPdfConverter.escapeHtml(labels.colFile()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDate()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDetail()));
            html.append("</th></tr>");
            for (OSFileDto f : files) {
                html.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(nvl(f.originalName, f.fileName)));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(fmt(f.createdAt)));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(f.contentType, f.fileExtension)));
                html.append("</td></tr>");
            }
            html.append("</table>");
        }

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionStock())).append("</h2>");
        if (movs.isEmpty()) {
            html.append("<p>").append(HtmlToPdfConverter.escapeHtml(labels.noRecords())).append("</p>");
        } else {
            html.append("<table><tr><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDate()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colType()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colRastreio()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colPn()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colSn()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colCert()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colQty()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colUser()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDetail()));
            html.append("</th></tr>");
            for (MovimentacaoEstoque m : movs) {
                ItemEstoque item = m.itemEstoqueId != null ? ItemEstoque.findById(m.itemEstoqueId) : m.itemEstoque;
                String pn = item != null ? item.partNumber : "—";
                String rastreio = item != null ? item.codigoRastreio : "—";
                String sn = item != null ? nvl(item.serialNumber, "—") : "—";
                String cert = item != null ? nvl(item.certificadoConformidade, "—") : "—";
                html.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(fmt(m.dataMovimentacao)));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(m.tipoMovimentacao != null ? m.tipoMovimentacao.name() : ""));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(rastreio));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(pn));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(sn));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(cert));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(m.quantidade != null ? m.quantidade.toPlainString() : ""));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(m.usuarioNome, "")));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(trunc(m.motivo, 120)));
                html.append("</td></tr>");
            }
            html.append("</table>");
        }

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionOsAudit())).append("</h2>");
        if (audit.isEmpty()) {
            html.append("<p>").append(HtmlToPdfConverter.escapeHtml(labels.noRecords())).append("</p>");
        } else {
            html.append("<table><tr><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDate()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colAction()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colUser()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDetail()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colIp()));
            html.append("</th></tr>");
            for (OSAuditoriaDto a : audit) {
                String detail = a.campoAlterado != null ? a.campoAlterado : "";
                if (a.valorNovo != null && !a.valorNovo.isBlank()) {
                    detail = detail + ": " + trunc(a.valorNovo, 80);
                }
                html.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(fmt(a.dataHora)));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(a.acaoDescricao, a.acao != null ? a.acao.name() : "")));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(a.usuarioNome, a.usuarioEmail)));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(detail));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(a.ipOrigem, "")));
                html.append("</td></tr>");
            }
            html.append("</table>");
        }

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionExternal())).append("</h2>");
        if (ext.isEmpty()) {
            html.append("<p>").append(HtmlToPdfConverter.escapeHtml(labels.noRecords())).append("</p>");
        } else {
            html.append("<table><tr><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDate()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colUser()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colAction()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colIp()));
            html.append("</th></tr>");
            for (LogAcessoExterno log : ext) {
                String user = "—";
                if (log.usuarioExterno != null) {
                    user = nvl(log.usuarioExterno.nome, log.usuarioExterno.email);
                }
                html.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(fmt(log.dataAcesso)));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(user));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(log.tipoAcao, "")));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(log.ipAcesso, "")));
                html.append("</td></tr>");
            }
            html.append("</table>");
        }

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionAccess())).append("</h2>");
        if (acc.isEmpty()) {
            html.append("<p>").append(HtmlToPdfConverter.escapeHtml(labels.noRecords())).append("</p>");
        } else {
            html.append("<table><tr><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDate()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colUser()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colAction()));
            html.append("</th><th>").append(HtmlToPdfConverter.escapeHtml(labels.colDetail()));
            html.append("</th></tr>");
            for (AcessoAuditoria row : acc) {
                html.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(fmt(row.createdAt)));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(row.email, "")));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(row.evento, "")));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(trunc(nvl(row.detalhe, row.recurso), 100)));
                html.append("</td></tr>");
            }
            html.append("</table>");
        }

        html.append(sgqExportService.buildSgqHtmlSection(locale));

        html.append("</body></html>");
        return html.toString();
    }

    private static void appendKv(StringBuilder html, String label, String value) {
        if (label == null) {
            return;
        }
        html.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(label));
        html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(value, "—")));
        html.append("</td></tr>");
    }

    private static String nvl(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        return b != null ? b : "";
    }

    private static String fmt(LocalDateTime dt) {
        return dt != null ? dt.format(DT) : "";
    }

    private static String trunc(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
