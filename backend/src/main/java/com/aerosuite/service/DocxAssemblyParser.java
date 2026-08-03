package com.aerosuite.service;

import com.aerosuite.dto.FcuAssemblyDoc;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.poi.xwpf.usermodel.XWPFDocument;
import org.apache.poi.xwpf.usermodel.XWPFParagraph;
import org.apache.poi.xwpf.usermodel.XWPFTable;
import org.apache.poi.xwpf.usermodel.XWPFTableRow;

import java.io.InputStream;
import java.util.ArrayList;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@ApplicationScoped
public class DocxAssemblyParser {

    // Expressões Regulares para captura de campos do cabeçalho
    private static final Pattern FIG_CAPTION = Pattern.compile("(?i)^(Fig(?:\\.|ura)\\s*\\d{2,4})\\s*[-–—:]+\\s*(.+)$");
    private static final Pattern PN_RE   = Pattern.compile("(?i)\\bP\\s*/?\\s*N\\s*[:#]?\\s*([\\w\\- /]+)"); // P/N: 4138008 / 3244872
    private static final Pattern SN_RE   = Pattern.compile("(?i)\\bS\\s*/?\\s*N\\s*[:#]?\\s*([\\w\\- /]+)"); // S/N: Serial Number
    private static final Pattern ATA_RE  = Pattern.compile("(?i)\\bATA\\s*[:#]?\\s*([\\d\\-]+)");
    private static final Pattern REV_RE  = Pattern.compile("(?i)\\bRev(?:ision)?\\.?\\s*[:#]?\\s*([\\w.\\-]+)");
    private static final Pattern REV_DT  = Pattern.compile("(?i)\\b(?:Data Rev\\.?|Revision Date)\\s*[:#]?\\s*([\\w, ./\\-]+)");
    private static final Pattern MANUAL  = Pattern.compile("(?i)\\bManual\\*?\\s*[:#]?\\s*([\\w\\-/ ]+)");
    private static final Pattern MODEL   = Pattern.compile("(?i)\\bModel(?:o)?\\s*[:#]?\\s*([\\w\\-/ ]+)");
    private static final Pattern CLIENT  = Pattern.compile("(?i)(?:Cliente|Client)\\s*[:#]?\\s*([\\w\\-/ ]+)");
    private static final Pattern COMPANY_RE = Pattern.compile("(?i)\\b(?:Company|Empresa|Fabricante)\\s*[:#]?\\s*([\\w\\-/ ]+)");
    private static final Pattern CERTIFICATE_RE = Pattern.compile("(?i)\\b(?:Certificate|Certificado|Cert\\.?)\\s*[:#]?\\s*([\\w\\-/ ]+)");
    private static final Pattern DATE_RE = Pattern.compile("(?i)\\b(?:Date|Data)\\s*[:#]?\\s*([\\w, ./\\-]+)");
    private static final Pattern OS_RE = Pattern.compile("(?i)\\b(?:OS|Ordem de Serviço|Work Order)\\s*[:#]?\\s*([\\w\\-/ ]+)");
    private static final Pattern PAGES_RE = Pattern.compile("(?i)\\b(?:Pages|Páginas|Page)\\s*[:#]?\\s*(\\d+)");
    private static final Pattern OBSERVATIONS_RE = Pattern.compile("(?i)\\b(?:Observations|Observações|Obs\\.?)\\s*[:#]?\\s*(.+)$");
    private static final Pattern FIG_RE  = Pattern.compile("(?i)\\b(Fig(?:\\.|ura)\\s*\\d{2,4})\\b");
    private static final Pattern TABLE_RE= Pattern.compile("(?i)\\b(Tabela|Table)\\s*(\\d{2,4})\\b");

    public FcuAssemblyDoc parse(InputStream in) throws Exception {
        List<String> figureCaptions = new ArrayList<>();
        try (XWPFDocument doc = new XWPFDocument(in)) {
            FcuAssemblyDoc out = new FcuAssemblyDoc();
            out.title = "Assembly Fuel Control Unit";
            out.sections = new ArrayList<>();

            // Passo 1: varrer parágrafos para metadados (topo) e seções/passos
            FcuAssemblyDoc.AssemblySection current = null;
            int paraIndex = 0;
            for (XWPFParagraph p : doc.getParagraphs()) {
                String text = normalize(p.getText());
                paraIndex++;
                if (text.isEmpty()) continue;

                // Header parsing (metadados) - todos os campos do cabeçalho
                applyIfMatch(PN_RE, text, v -> out.pn = v);
                applyIfMatch(SN_RE, text, v -> out.sn = v);
                applyIfMatch(ATA_RE, text, v -> out.ata = v);
                applyIfMatch(REV_RE, text, v -> out.revision = v);
                applyIfMatch(REV_DT, text, v -> out.revisionDate = v);
                applyIfMatch(MANUAL, text, v -> out.manual = v);
                applyIfMatch(MODEL, text, v -> out.model = v);
                applyIfMatch(CLIENT, text, v -> out.client = v);
                applyIfMatch(COMPANY_RE, text, v -> out.company = v);
                applyIfMatch(CERTIFICATE_RE, text, v -> out.certificate = v);
                applyIfMatch(DATE_RE, text, v -> out.date = v);
                applyIfMatch(OS_RE, text, v -> out.os = v);
                applyIfMatch(PAGES_RE, text, v -> {
                    try {
                        out.pages = Integer.parseInt(v);
                    } catch (NumberFormatException e) {
                        // Ignore invalid page numbers
                    }
                });
                applyIfMatch(OBSERVATIONS_RE, text, v -> out.observations = v);

                // Detect section title (CAPS + not too short)
                if (isSectionTitle(text)) {
                    current = new FcuAssemblyDoc.AssemblySection();
                    current.id = toId(text);
                    current.title = text;
                    current.steps = new ArrayList<>();
                    out.sections.add(current);
                    continue;
                }

                if (current == null) {
                    current = new FcuAssemblyDoc.AssemblySection();
                    current.id = "section-" + paraIndex;
                    current.title = "Section";
                    current.steps = new ArrayList<>();
                    out.sections.add(current);
                }

                // Identify figure/table references
                List<String> refs = new ArrayList<>();
                Matcher figM = FIG_RE.matcher(text);
                while (figM.find()) refs.add(figM.group(1));
                Matcher tabM = TABLE_RE.matcher(text);
                while (tabM.find()) refs.add((tabM.group(1) + " " + tabM.group(2)).trim());

                // Determine kind
                String kind = guessKind(text);

                FcuAssemblyDoc.AssemblyStep step = new FcuAssemblyDoc.AssemblyStep();
                step.kind = kind;
                step.text = text;
                step.refs = refs.isEmpty() ? null : refs;
                current.steps.add(step);

                // Capturar legendas de figuras
                Matcher capM = FIG_CAPTION.matcher(text);
                if (capM.find()) {
                    String caption = capM.group(1) + " — " + capM.group(2);
                    figureCaptions.add(caption.trim());
                }
            }

            // Passo 2: tabelas
            List<XWPFTable> tables = doc.getTables();
            if (tables != null && !tables.isEmpty()) {
                FcuAssemblyDoc.AssemblySection tablesSection = new FcuAssemblyDoc.AssemblySection();
                tablesSection.id = "tables";
                tablesSection.title = "Tables";
                tablesSection.steps = new ArrayList<>();
                for (XWPFTable t : tables) {
                    String md = toMarkdownTable(t);
                    if (md != null && !md.isBlank()) {
                        FcuAssemblyDoc.AssemblyStep st = new FcuAssemblyDoc.AssemblyStep();
                        st.kind = "table";
                        st.title = "Tabela";
                        st.text = md;
                        tablesSection.steps.add(st);
                    }
                }
                if (!tablesSection.steps.isEmpty()) out.sections.add(tablesSection);
            }

            // Passo 3: figuras (imagens incorporadas)
            if (doc.getAllPictures() != null && !doc.getAllPictures().isEmpty()) {
                FcuAssemblyDoc.AssemblySection figSection = new FcuAssemblyDoc.AssemblySection();
                figSection.id = "figures";
                figSection.title = "Figures";
                figSection.steps = new ArrayList<>();
                int idx = 1;
                for (org.apache.poi.xwpf.usermodel.XWPFPictureData pic : doc.getAllPictures()) {
                    FcuAssemblyDoc.AssemblyStep st = new FcuAssemblyDoc.AssemblyStep();
                    st.kind = "figure";
                    String cap = (idx - 1) < figureCaptions.size()
                            ? figureCaptions.get(idx - 1)
                            : ("Figura " + idx);
                    st.title = cap;
                    idx++;
                    st.text = "";
                    String mime = pic.getPackagePart().getContentType();
                    if (mime == null || mime.isBlank()) {
                        int pictureType = pic.getPictureType();
                        if (pictureType == org.apache.poi.xwpf.usermodel.Document.PICTURE_TYPE_PNG) {
                            mime = "image/png";
                        } else if (pictureType == org.apache.poi.xwpf.usermodel.Document.PICTURE_TYPE_JPEG) {
                            mime = "image/jpeg";
                        } else if (pictureType == org.apache.poi.xwpf.usermodel.Document.PICTURE_TYPE_GIF) {
                            mime = "image/gif";
                        } else {
                            mime = "image/png";
                        }
                    }
                    st.imageType = mime;
                    st.imageData = java.util.Base64.getEncoder().encodeToString(pic.getData());
                    figSection.steps.add(st);
                }
                if (!figSection.steps.isEmpty()) out.sections.add(figSection);
            }

            return out;
        }
    }

    private String normalize(String s) {
        if (s == null) return "";
        return s.replace('\u00A0', ' ').trim();
    }

    private String toId(String title) {
        return title.toLowerCase().replaceAll("[^a-z0-9]+", "-").replaceAll("(^-|-$)", "");
    }

    private boolean isSectionTitle(String text) {
        if (text.length() < 6) return false;
        return text.equals(text.toUpperCase());
    }

    private void applyIfMatch(Pattern pat, String text, java.util.function.Consumer<String> setter) {
        Matcher m = pat.matcher(text);
        if (m.find()) {
            String val = m.group(1).trim();
            if (!val.isEmpty()) setter.accept(val);
        }
    }

    private String guessKind(String text) {
        String t = text.toLowerCase();
        if (t.contains("warning")) return "warning";
        if (t.contains("caution") || t.contains("cuidado")) return "caution";
        if (t.startsWith("note") || t.startsWith("nota")) return "note";
        return "step";
    }

    private String toMarkdownTable(XWPFTable table) {
        List<String> lines = new ArrayList<>();
        List<XWPFTableRow> rows = table.getRows();
        if (rows == null || rows.isEmpty()) return null;

        List<String> header = new ArrayList<>();
        rows.get(0).getTableCells().forEach(c -> header.add(safe(c.getText())));
        lines.add("| " + String.join(" | ", header) + " |");
        lines.add("| " + header.stream()
                .map(h -> repeat('-', Math.max(3, h.length())))
                .reduce((a, b) -> a + " | " + b)
                .orElse("---") + " |");

        for (int i = 1; i < rows.size(); i++) {
            List<String> cols = new ArrayList<>();
            rows.get(i).getTableCells().forEach(c -> cols.add(safe(c.getText())));
            lines.add("| " + String.join(" | ", cols) + " |");
        }
        return String.join(System.lineSeparator(), lines);
    }

    private String safe(String s) {
        return s == null ? "" : s.replace('|', '/').trim();
    }

    private String repeat(char ch, int n) {
        StringBuilder sb = new StringBuilder(n);
        for (int i = 0; i < n; i++) sb.append(ch);
        return sb.toString();
    }
}
