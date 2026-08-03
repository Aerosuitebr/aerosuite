package com.aerosuite.service;

import com.aerosuite.domain.OS;
import com.aerosuite.domain.SistemaEmpresaConfig;
import com.aerosuite.domain.TenantConstants;
import com.aerosuite.dto.OSFileDto;
import com.aerosuite.dto.PacoteAuditoriaTenantResumoDto;
import com.aerosuite.dossie.PacoteAuditoriaLabels;
import com.aerosuite.security.TenantDataAccess;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.databind.SerializationFeature;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import org.jboss.logging.Logger;

import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.zip.ZipEntry;
import java.util.zip.ZipOutputStream;

@ApplicationScoped
public class PacoteAuditoriaTenantService {

    private static final Logger LOG = Logger.getLogger(PacoteAuditoriaTenantService.class);

    public enum PeriodoCampo {
        ABERTURA,
        FECHAMENTO
    }

    public record RetencaoManifest(int anosRetencao, LocalDate dataLimiteRetencao) {}

    public static final int DEFAULT_LIMIT = 30;
    public static final int MAX_LIMIT = 100;

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");
    private static final DateTimeFormatter D = DateTimeFormatter.ofPattern("yyyy-MM-dd");

    @Inject
    TenantDataAccess tenantDataAccess;

    @Inject
    DossieAuditoriaService dossieAuditoriaService;

    @Inject
    OSFileService osFileService;

    @Inject
    OsCrsService crsService;

    @Inject
    ConformidadeSgqExportService sgqExportService;

    private final ObjectMapper json = new ObjectMapper()
            .registerModule(new JavaTimeModule())
            .disable(SerializationFeature.WRITE_DATES_AS_TIMESTAMPS);

    public PacoteAuditoriaTenantResumoDto preview(
            LocalDate dataInicio, LocalDate dataFim, Integer limite, List<Integer> numerosOs) {
        return preview(dataInicio, dataFim, limite, numerosOs, PeriodoCampo.ABERTURA);
    }

    public PacoteAuditoriaTenantResumoDto preview(
            LocalDate dataInicio,
            LocalDate dataFim,
            Integer limite,
            List<Integer> numerosOs,
            PeriodoCampo periodoCampo) {
        List<OS> oss = resolverOs(dataInicio, dataFim, limite, numerosOs, periodoCampo);
        PacoteAuditoriaTenantResumoDto dto = new PacoteAuditoriaTenantResumoDto();
        dto.totalOsIncluidas = oss.size();
        dto.limiteMaximo = normalizeLimit(limite);
        dto.dataInicio = dataInicio != null ? dataInicio.toString() : null;
        dto.dataFim = dataFim != null ? dataFim.toString() : null;
        for (OS os : oss) {
            PacoteAuditoriaTenantResumoDto.OsPacoteLinhaDto linha = new PacoteAuditoriaTenantResumoDto.OsPacoteLinhaDto();
            linha.osId = os.id;
            linha.numeroOs = os.idOs;
            linha.clienteNome = os.clienteNome;
            linha.dtAbertura = os.dtAbertura != null ? os.dtAbertura.toString() : null;
            linha.dataFechamento = os.dataFechamento != null ? os.dataFechamento.toString() : null;
            linha.partNumber = os.partNumber;
            linha.serialNumber = os.serialNumber;
            linha.crsEmitido = os.crsEmitidoEm != null;
            linha.totalAnexos = osFileService.getFilesByOSId(os.id).size();
            dto.ordens.add(linha);
        }
        return dto;
    }

    public byte[] exportZip(
            LocalDate dataInicio, LocalDate dataFim, Integer limite, List<Integer> numerosOs, String locale)
            throws Exception {
        return exportZip(dataInicio, dataFim, limite, numerosOs, locale, PeriodoCampo.ABERTURA, null);
    }

    public byte[] exportZip(
            LocalDate dataInicio,
            LocalDate dataFim,
            Integer limite,
            List<Integer> numerosOs,
            String locale,
            PeriodoCampo periodoCampo,
            RetencaoManifest retencao)
            throws Exception {
        List<OS> oss = resolverOs(dataInicio, dataFim, limite, numerosOs, periodoCampo);
        PacoteAuditoriaLabels labels = PacoteAuditoriaLabels.forLocale(locale);
        String tenantKey = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        String empresaNome = resolveEmpresaNome(tenantKey);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try (ZipOutputStream zip = new ZipOutputStream(baos)) {
            String readme = buildReadme(labels, empresaNome, oss.size(), dataInicio, dataFim, periodoCampo, retencao);
            putText(zip, "README.txt", readme);
            if (retencao != null) {
                putText(zip, "RETENCAO.txt", buildRetencaoTxt(labels, retencao, periodoCampo));
            }

            Map<String, Object> indice = new HashMap<>();
            indice.put("geradoEm", LocalDateTime.now().toString());
            indice.put("tenantId", tenantKey);
            indice.put("empresa", empresaNome);
            indice.put("totalOs", oss.size());
            indice.put("dataInicio", dataInicio != null ? dataInicio.toString() : null);
            indice.put("dataFim", dataFim != null ? dataFim.toString() : null);
            List<Map<String, Object>> linhas = new ArrayList<>();
            for (OS os : oss) {
                Map<String, Object> row = new HashMap<>();
                row.put("osId", os.id);
                row.put("numeroOs", os.idOs);
                row.put("cliente", os.clienteNome);
                String base = "os/OS_" + os.idOs + "_" + os.id + "/";
                row.put("arquivoPdf", base + "dossie.pdf");
                row.put("crsEmitido", os.crsEmitidoEm != null);
                if (os.crsEmitidoEm != null) {
                    row.put("arquivoCrsPdf", base + "crs.pdf");
                }
                List<Map<String, Object>> anexos = adicionarAnexosOs(zip, os, base + "anexos/");
                row.put("anexos", anexos);
                row.put("totalAnexosIncluidos", anexos.size());
                linhas.add(row);

                byte[] pdf = dossieAuditoriaService.exportPdf(os.id, null, locale);
                putBytes(zip, base + "dossie.pdf", pdf);

                if (os.crsEmitidoEm != null) {
                    try {
                        byte[] crsPdf = crsService.exportPdf(os.id, locale);
                        putBytes(zip, base + "crs.pdf", crsPdf);
                    } catch (Exception e) {
                        LOG.warnf(e, "PacoteAuditoriaTenantService - CRS PDF omitido OS %s: %s",
                                os.idOs, e.getMessage());
                    }
                }
            }
            indice.put("ordens", linhas);

            Map<String, Object> sgq = sgqExportService.buildSnapshotJson(60);
            putText(zip, "sgq/resumo.csv", sgqExportService.buildSgqCsvResumo());
            putText(zip, "sgq/snapshot.json", json.writerWithDefaultPrettyPrinter().writeValueAsString(sgq));
            indice.put("sgq", Map.of("pasta", "sgq/", "arquivos", List.of("sgq/resumo.csv", "sgq/snapshot.json")));

            putText(zip, "indice.json", json.writerWithDefaultPrettyPrinter().writeValueAsString(indice));
        }
        return baos.toByteArray();
    }

    public String suggestedZipName() {
        return "Pacote_Auditoria_" + LocalDate.now().format(D) + ".zip";
    }

    private List<Map<String, Object>> adicionarAnexosOs(ZipOutputStream zip, OS os, String pastaAnexos)
            throws Exception {
        List<Map<String, Object>> meta = new ArrayList<>();
        List<OSFileDto> files = osFileService.getFilesByOSId(os.id);
        Set<String> usedNames = new HashSet<>();
        for (OSFileDto file : files) {
            if (file.id == null) {
                continue;
            }
            var bytesOpt = osFileService.readFileBytes(file.id);
            if (bytesOpt.isEmpty()) {
                continue;
            }
            String display =
                    file.originalName != null && !file.originalName.isBlank() ? file.originalName : file.fileName;
            String entryFile = uniqueZipFileName(safeZipSegment(display), usedNames);
            String zipPath = pastaAnexos + entryFile;
            putBytes(zip, zipPath, bytesOpt.get());
            Map<String, Object> item = new HashMap<>();
            item.put("caminho", zipPath);
            item.put("nomeOriginal", display);
            item.put("tamanhoBytes", bytesOpt.get().length);
            item.put("contentType", file.contentType);
            meta.add(item);
        }
        return meta;
    }

    private static String uniqueZipFileName(String base, Set<String> used) {
        String candidate = base;
        int n = 2;
        while (!used.add(candidate.toLowerCase())) {
            int dot = base.lastIndexOf('.');
            if (dot > 0) {
                candidate = base.substring(0, dot) + "_" + n + base.substring(dot);
            } else {
                candidate = base + "_" + n;
            }
            n++;
        }
        return candidate;
    }

    private static String safeZipSegment(String name) {
        if (name == null || name.isBlank()) {
            return "arquivo";
        }
        String s = name.replaceAll("[\\\\/:*?\"<>|]", "_").trim();
        if (s.isBlank()) {
            return "arquivo";
        }
        return s.length() > 180 ? s.substring(0, 180) : s;
    }

    private List<OS> resolverOs(
            LocalDate dataInicio,
            LocalDate dataFim,
            Integer limite,
            List<Integer> numerosOs,
            PeriodoCampo periodoCampo) {
        int max = normalizeLimit(limite);
        String tid = TenantConstants.tenantIdOf(tenantDataAccess.currentTenantId());
        PeriodoCampo campo = periodoCampo != null ? periodoCampo : PeriodoCampo.ABERTURA;

        if (numerosOs != null && !numerosOs.isEmpty()) {
            List<OS> result = new ArrayList<>();
            for (Integer num : numerosOs) {
                if (num == null) {
                    continue;
                }
                OS os = OS.find("tenantId = ?1 and idOs = ?2", tid, num).firstResult();
                if (os != null) {
                    result.add(os);
                }
                if (result.size() >= max) {
                    break;
                }
            }
            return result;
        }

        StringBuilder jpql = new StringBuilder("tenantId = ?1");
        List<Object> args = new ArrayList<>();
        args.add(tid);
        int idx = 2;
        String dateField = campo == PeriodoCampo.FECHAMENTO ? "dataFechamento" : "dtAbertura";
        if (campo == PeriodoCampo.FECHAMENTO) {
            jpql.append(" and dataFechamento is not null");
        }
        if (dataInicio != null) {
            jpql.append(" and ").append(dateField).append(" >= ?").append(idx);
            args.add(dataInicio);
            idx++;
        }
        if (dataFim != null) {
            jpql.append(" and ").append(dateField).append(" <= ?").append(idx);
            args.add(dataFim);
            idx++;
        }
        if (campo == PeriodoCampo.FECHAMENTO) {
            jpql.append(" order by dataFechamento desc, id desc");
        } else {
            jpql.append(" order by dtAbertura desc, id desc");
        }

        return OS.find(jpql.toString(), args.toArray()).page(0, max).list();
    }

    private int normalizeLimit(Integer limite) {
        if (limite == null || limite <= 0) {
            return DEFAULT_LIMIT;
        }
        return Math.min(limite, MAX_LIMIT);
    }

    private String resolveEmpresaNome(String tenantKey) {
        try {
            SistemaEmpresaConfig cfg = SistemaEmpresaConfig.find("tenantId = ?1", tenantKey).firstResult();
            if (cfg != null && cfg.displayName != null && !cfg.displayName.isBlank()) {
                return cfg.displayName;
            }
            if (cfg != null && cfg.razaoSocial != null && !cfg.razaoSocial.isBlank()) {
                return cfg.razaoSocial;
            }
        } catch (Exception ignored) {
        }
        return "Organização";
    }

    private String buildReadme(
            PacoteAuditoriaLabels labels,
            String empresa,
            int total,
            LocalDate inicio,
            LocalDate fim,
            PeriodoCampo periodoCampo,
            RetencaoManifest retencao) {
        StringBuilder sb = new StringBuilder();
        sb.append(labels.title()).append("\n");
        sb.append("=".repeat(Math.min(50, labels.title().length()))).append("\n\n");
        sb.append(labels.empresa()).append(": ").append(empresa).append("\n");
        sb.append(labels.geradoEm()).append(": ").append(LocalDateTime.now().format(DT)).append("\n");
        sb.append(labels.totalOs()).append(": ").append(total).append("\n");
        if (periodoCampo == PeriodoCampo.FECHAMENTO) {
            sb.append(labels.periodoFechamento()).append("\n");
        }
        if (inicio != null || fim != null) {
            sb.append(labels.periodo()).append(": ");
            sb.append(inicio != null ? inicio.format(D) : "—");
            sb.append(" → ");
            sb.append(fim != null ? fim.format(D) : "—");
            sb.append("\n");
        }
        if (retencao != null) {
            sb.append(labels.retencaoAnos()).append(": ").append(retencao.anosRetencao()).append("\n");
            sb.append(labels.retencaoLimite()).append(": ").append(retencao.dataLimiteRetencao().format(D)).append("\n");
        }
        sb.append("\n").append(labels.estrutura()).append("\n");
        sb.append(labels.estruturaLinha1()).append("\n");
        sb.append(labels.estruturaLinha2()).append("\n");
        sb.append(labels.estruturaLinha3()).append("\n");
        sb.append("  sgq/resumo.csv, sgq/snapshot.json — bloco SGQ (NC, treinos, calibração, docs, ASL)\n");
        sb.append("\n").append(labels.aviso()).append("\n");
        return sb.toString();
    }

    private static String buildRetencaoTxt(
            PacoteAuditoriaLabels labels, RetencaoManifest retencao, PeriodoCampo periodoCampo) {
        StringBuilder sb = new StringBuilder();
        sb.append(labels.retencaoTitulo()).append("\n\n");
        sb.append(labels.retencaoAnos()).append(": ").append(retencao.anosRetencao()).append("\n");
        sb.append(labels.retencaoLimite()).append(": ").append(retencao.dataLimiteRetencao().format(D)).append("\n");
        sb.append(labels.retencaoFiltro()).append(": ");
        sb.append(periodoCampo == PeriodoCampo.FECHAMENTO ? labels.retencaoFiltroFechamento() : labels.retencaoFiltroAbertura());
        sb.append("\n\n").append(labels.retencaoAviso()).append("\n");
        return sb.toString();
    }

    private static void putText(ZipOutputStream zip, String path, String content) throws Exception {
        putBytes(zip, path, content.getBytes(StandardCharsets.UTF_8));
    }

    private static void putBytes(ZipOutputStream zip, String path, byte[] data) throws Exception {
        ZipEntry entry = new ZipEntry(path);
        zip.putNextEntry(entry);
        zip.write(data);
        zip.closeEntry();
    }
}

