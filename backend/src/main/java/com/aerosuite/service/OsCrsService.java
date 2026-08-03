package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import com.aerosuite.audit.AuditoriaUsuarioContext;
import com.aerosuite.crs.Part145CrsSegregation;
import com.aerosuite.crs.OsCrsChecklist;
import com.aerosuite.crs.OsCrsLabels;
import com.aerosuite.domain.OS;
import com.aerosuite.domain.SistemaEmpresaConfig;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.OsCrsDto;
import com.aerosuite.dto.OsCrsEmitirRequest;
import com.aerosuite.security.TenantDataAccess;
import com.aerosuite.util.HtmlToPdfConverter;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.transaction.Transactional;
import jakarta.ws.rs.BadRequestException;

import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class OsCrsService {

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    OSAuditoriaService osAuditoriaService;

    @Inject
    HtmlToPdfConverter htmlToPdfConverter;

    @Inject
    com.aerosuite.security.InternalUserContext internalUser;

    @Inject
    Part145CrsSegregation crsSegregation;

    @Inject
    UsuarioHabilitacaoService habilitacaoService;

    @Inject
    ConformidadeEnforcementService conformidadeEnforcement;

    private final ObjectMapper json = new ObjectMapper();

    public Map<String, Object> checklistTemplate(String locale) {
        Map<String, Object> out = new LinkedHashMap<>();
        out.put("itens", OsCrsChecklist.all().stream()
                .map(i -> Map.of("code", i.code(), "label", label(i, locale)))
                .toList());
        return out;
    }

    public OsCrsDto obter(Long osId) {
        OS os = tenantDataAccess.requireOS(osId);
        return toDto(os);
    }

    public static final String ERROR_JA_EMITIDO = "crs.error.ja_emitido";
    public static final String ERROR_CHECKLIST_INCOMPLETO = "crs.error.checklist_incompleto";
    public static final String ERROR_NOME_OBRIGATORIO = "crs.error.nome_obrigatorio";
    public static final String ERROR_CARGO_OBRIGATORIO = "crs.error.cargo_obrigatorio";
    public static final String ERROR_CHECKLIST_INVALIDO = "crs.error.checklist_invalido";

    @Transactional
    public OsCrsDto emitir(Long osId, OsCrsEmitirRequest req, String locale) {
        if (req == null) {
            throw new BadRequestException(ApiI18nMessages.domain("crs.error.payload_vazio"));
        }
        if (!OsCrsChecklist.isValidCodes(req.checklistConfirmados)) {
            throw new BadRequestException(ERROR_CHECKLIST_INCOMPLETO);
        }
        if (req.crsLiberadoPorNome == null || req.crsLiberadoPorNome.isBlank()) {
            throw new BadRequestException(ERROR_NOME_OBRIGATORIO);
        }
        if (req.crsLiberadoPorCargo == null || req.crsLiberadoPorCargo.isBlank()) {
            throw new BadRequestException(ERROR_CARGO_OBRIGATORIO);
        }

        OS os = tenantDataAccess.requireOS(osId);
        if (os.crsEmitidoEm != null) {
            throw new BadRequestException(ERROR_JA_EMITIDO);
        }
        crsSegregation.assertMayEmit(
                osId,
                internalUser.getUserId(),
                internalUser.getPerfilCodigo());
        conformidadeEnforcement.assertOperacaoOsConformidade(
                os.idOs,
                internalUser.getUserId() != null ? internalUser.getUserId().longValue() : null,
                internalUser.getPerfilCodigo(),
                null);
        habilitacaoService.assertHabilitacaoValidaParaCrs(
                internalUser.getUserId(), internalUser.getPerfilCodigo());
        os.crsEmitidoEm = LocalDateTime.now();
        os.crsLiberadoPorUsuarioId =
                internalUser.isAuthenticated() && internalUser.getUserId() != null
                        ? internalUser.getUserId().longValue()
                        : null;
        os.crsLiberadoPorNome = req.crsLiberadoPorNome.trim();
        os.crsLiberadoPorCargo = req.crsLiberadoPorCargo.trim();
        os.crsCertificadoNumero =
                req.crsCertificadoNumero != null && !req.crsCertificadoNumero.isBlank()
                        ? req.crsCertificadoNumero.trim()
                        : gerarNumeroCrs(os);
        os.crsObservacoes = req.crsObservacoes;
        try {
            os.crsChecklistJson = json.writeValueAsString(req.checklistConfirmados);
        } catch (Exception e) {
            throw new BadRequestException(ERROR_CHECKLIST_INVALIDO);
        }
        if (os.dataConclusaoServ == null) {
            os.dataConclusaoServ = java.time.LocalDate.now();
        }
        AuditoriaUsuarioContext ctx =
                new AuditoriaUsuarioContext(
                        internalUser.getNome(),
                        internalUser.getEmail(),
                        os.crsLiberadoPorUsuarioId,
                        "—",
                        null);
        osAuditoriaService.registrarEventoArquivo(
                os.id,
                os.idOs,
                com.aerosuite.domain.OSAuditoria.AcaoAuditoria.ALTERACAO,
                "CRS",
                null,
                "{\"crsCertificado\":\"" + os.crsCertificadoNumero + "\"}",
                ctx);

        return toDto(os);
    }

    public byte[] exportPdf(Long osId, String locale) throws Exception {
        OS os = tenantDataAccess.requireOS(osId);
        if (os.crsEmitidoEm == null) {
            throw new BadRequestException(ApiI18nMessages.encode(ApiI18nMessages.OS_CRS_NOT_EMITTED));
        }
        return htmlToPdfConverter.toPdf(buildHtml(os, locale));
    }

    public String suggestedFileName(OS os) {
        String num = os.crsCertificadoNumero != null ? os.crsCertificadoNumero : "OS" + os.idOs;
        return "CRS_" + num.replaceAll("[^a-zA-Z0-9_-]", "_") + ".pdf";
    }

    private String gerarNumeroCrs(OS os) {
        return "CRS-" + os.idOs + "-" + LocalDateTime.now().format(DateTimeFormatter.ofPattern("yyyyMMdd"));
    }

    private OsCrsDto toDto(OS os) {
        OsCrsDto dto = new OsCrsDto();
        dto.osId = os.id;
        dto.numeroOs = os.idOs;
        dto.emitido = os.crsEmitidoEm != null;
        dto.crsEmitidoEm = os.crsEmitidoEm;
        dto.crsLiberadoPorUsuarioId = os.crsLiberadoPorUsuarioId;
        dto.crsLiberadoPorNome = os.crsLiberadoPorNome;
        dto.crsLiberadoPorCargo = os.crsLiberadoPorCargo;
        dto.crsCertificadoNumero = os.crsCertificadoNumero;
        dto.crsObservacoes = os.crsObservacoes;
        if (os.crsChecklistJson != null && !os.crsChecklistJson.isBlank()) {
            try {
                dto.checklistItensMarcados =
                        json.readValue(os.crsChecklistJson, new TypeReference<List<String>>() {});
            } catch (Exception ignored) {
                dto.checklistItensMarcados = List.of();
            }
        }
        return dto;
    }

    private String buildHtml(OS os, String locale) throws Exception {
        OsCrsLabels labels = OsCrsLabels.forLocale(locale);
        String empresa = resolveEmpresaNome();
        String generated = os.crsEmitidoEm != null ? os.crsEmitidoEm.format(DT) : "";

        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><style>");
        html.append("body{font-family:Arial,Helvetica,sans-serif;font-size:11pt;margin:28px;color:#111;}");
        html.append("h1{font-size:18pt;margin:0 0 6px;} .sub{color:#555;font-size:10pt;margin-bottom:20px;}");
        html.append("table{width:100%;border-collapse:collapse;margin:12px 0;} ");
        html.append("td,th{border:1px solid #ccc;padding:6px 8px;text-align:left;font-size:10pt;}");
        html.append("th{background:#f0f4f8;width:32%;} ul{margin:8px 0;padding-left:18px;} ");
        html.append(".footer{margin-top:24px;font-size:9pt;color:#666;border-top:1px solid #ddd;padding-top:8px;}");
        html.append("</style></head><body>");

        html.append("<h1>").append(HtmlToPdfConverter.escapeHtml(labels.title())).append("</h1>");
        html.append("<p class=\"sub\">").append(HtmlToPdfConverter.escapeHtml(empresa)).append("</p>");

        html.append("<table>");
        appendRow(html, labels.certificado(), os.crsCertificadoNumero);
        appendRow(html, labels.os(), String.valueOf(os.idOs));
        appendRow(html, labels.cliente(), os.clienteNome);
        appendRow(html, labels.pn(), os.partNumber);
        appendRow(html, labels.sn(), os.serialNumber);
        appendRow(html, labels.matricula(), os.marcasMatricula);
        appendRow(html, labels.tipoServico(), os.tipoServico);
        appendRow(html, labels.emitidoEm(), generated);
        appendRow(html, labels.liberadoPor(), os.crsLiberadoPorNome);
        appendRow(html, labels.cargo(), os.crsLiberadoPorCargo);
        appendRow(html, labels.observacoes(), os.crsObservacoes);
        html.append("</table>");

        html.append("<h2 style=\"font-size:13pt;\">")
                .append(HtmlToPdfConverter.escapeHtml(labels.checklistTitle()))
                .append("</h2><ul>");
        List<String> codes =
                os.crsChecklistJson != null
                        ? json.readValue(os.crsChecklistJson, new TypeReference<List<String>>() {})
                        : List.of();
        Map<String, String> codeLabels = OsCrsChecklist.codesToLabels(locale);
        for (String code : codes) {
            html.append("<li>✓ ")
                    .append(HtmlToPdfConverter.escapeHtml(codeLabels.getOrDefault(code, code)))
                    .append("</li>");
        }
        html.append("</ul>");

        html.append("<p class=\"footer\">").append(HtmlToPdfConverter.escapeHtml(labels.footer())).append("</p>");
        html.append("</body></html>");
        return html.toString();
    }

    private static void appendRow(StringBuilder html, String label, String value) {
        html.append("<tr><th>").append(HtmlToPdfConverter.escapeHtml(label));
        html.append("</th><td>").append(HtmlToPdfConverter.escapeHtml(value != null ? value : "—"));
        html.append("</td></tr>");
    }

    private String resolveEmpresaNome() {
        String tid = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        try {
            long id = Long.parseLong(tid);
            SistemaEmpresaConfig cfg = SistemaEmpresaConfig.find("tenantId = ?1", tid).firstResult();
            if (cfg != null && cfg.displayName != null && !cfg.displayName.isBlank()) {
                return cfg.displayName;
            }
            if (cfg != null && cfg.razaoSocial != null && !cfg.razaoSocial.isBlank()) {
                return cfg.razaoSocial;
            }
        } catch (NumberFormatException ignored) {
        }
        return "Organização";
    }

    private static String label(OsCrsChecklist.Item item, String locale) {
        String key = locale != null ? locale.toLowerCase() : "pt-br";
        if (key.startsWith("en")) {
            return item.labelEn();
        }
        if (key.startsWith("es")) {
            return item.labelEs();
        }
        if (key.startsWith("fr")) {
            return item.labelFr();
        }
        return item.labelPt();
    }

}
