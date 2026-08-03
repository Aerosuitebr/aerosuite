package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.dto.FcuAssemblyDoc;
import com.aerosuite.dto.FcuAssemblyDoc.AssemblySection;
import com.aerosuite.dto.FcuAssemblyDoc.AssemblyStep;
import com.lowagie.text.*;
import com.lowagie.text.pdf.*;
import jakarta.enterprise.context.ApplicationScoped;

import jakarta.inject.Inject;

import java.io.ByteArrayOutputStream;
import java.util.List;
import java.util.ArrayList;

@ApplicationScoped
public class FcuAssemblyPdfExporter {

    @Inject
    CommercialBrandingService commercialBrandingService;

    static class FooterEvent extends PdfPageEventHelper {
        String brand;
        FooterEvent(String brand) { this.brand = brand; }

        @Override
        public void onEndPage(PdfWriter writer, Document document) {
            try {
                Font f = FontFactory.getFont(FontFactory.HELVETICA, 8);
                Phrase left = new Phrase(brand != null ? brand : "", f);
                Phrase right = new Phrase(String.valueOf(writer.getPageNumber()), f);
                PdfContentByte cb = writer.getDirectContent();
                ColumnText.showTextAligned(cb, Element.ALIGN_LEFT, left,
                        document.left(), document.bottom() - 10, 0);
                ColumnText.showTextAligned(cb, Element.ALIGN_RIGHT, right,
                        document.right(), document.bottom() - 10, 0);
            } catch (Exception ignored) {}
        }
    }

    static class TocEntry {
        String title;
        int page;
        TocEntry(String t, int p) { title = t; page = p; }
    }

    public byte[] export(FcuAssemblyDoc doc) {
        try {
            // ===== PASSO 1: renderizar CONTEÚDO =====
            ByteArrayOutputStream contentBaos = new ByteArrayOutputStream();
            Document contentDoc = new Document(PageSize.A4, 36, 36, 48, 48);
            PdfWriter contentWriter = PdfWriter.getInstance(contentDoc, contentBaos);
            contentDoc.open();

            Font h1 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font h2 = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 11);
            Font text = FontFactory.getFont(FontFactory.HELVETICA, 10);

            List<TocEntry> tocEntries = new ArrayList<>();

            Paragraph title = new Paragraph(doc.title != null ? doc.title : "Assembly Document", h1);
            title.setSpacingAfter(8f);
            contentDoc.add(title);

            PdfPTable meta = new PdfPTable(4);
            meta.setWidthPercentage(100);
            addMeta(meta, "P/N", doc.pn);
            addMeta(meta, "S/N", doc.sn);
            addMeta(meta, "Modelo", doc.model);
            addMeta(meta, "ATA", doc.ata);
            addMeta(meta, "Manual", doc.manual);
            addMeta(meta, "Rev.", doc.revision);
            addMeta(meta, "Data Rev.", doc.revisionDate);
            addMeta(meta, "Cliente", doc.client);
            contentDoc.add(meta);

            if (doc.observations != null && !doc.observations.isBlank()) {
                Paragraph obs = new Paragraph("Observações: " + doc.observations, text);
                obs.setSpacingBefore(8f);
                obs.setSpacingAfter(8f);
                contentDoc.add(obs);
            }

            if (doc.sections != null) {
                for (AssemblySection sec : doc.sections) {
                    if (sec == null) continue;
                    Paragraph secTitle = new Paragraph(sec.title != null ? sec.title : "Seção", h2);
                    secTitle.setSpacingBefore(10f);
                    secTitle.setSpacingAfter(6f);
                    contentDoc.add(secTitle);
                    tocEntries.add(new TocEntry(secTitle.getContent(), contentWriter.getPageNumber()));

                    if (sec.steps != null) {
                        for (AssemblyStep st : sec.steps) {
                            if (st == null) continue;
                            String prefix = kindPrefix(st.kind);

                            if ("figure".equalsIgnoreCase(st.kind)
                                    && st.imageData != null && !st.imageData.isBlank()) {
                                byte[] bytes = java.util.Base64.getDecoder().decode(st.imageData);
                                Image img = Image.getInstance(bytes);
                                float maxW = PageSize.A4.getWidth() - 72;
                                if (img.getScaledWidth() > maxW) {
                                    img.scaleToFit(maxW, PageSize.A4.getHeight() / 2);
                                }
                                img.setSpacingAfter(6f);
                                contentDoc.add(img);
                                if (st.title != null && !st.title.isBlank()) {
                                    Paragraph cap = new Paragraph(st.title, text);
                                    cap.setSpacingAfter(4f);
                                    contentDoc.add(cap);
                                }
                            } else if ("table".equalsIgnoreCase(st.kind)) {
                                PdfPTable t = mdToTable(st.text);
                                if (t != null) {
                                    t.setSpacingBefore(4f);
                                    t.setSpacingAfter(6f);
                                    contentDoc.add(t);
                                }
                            } else {
                                Paragraph p = new Paragraph(
                                        prefix +
                                        (st.title != null ? (st.title + " – ") : "") +
                                        (st.text != null ? st.text : ""),
                                        text
                                );
                                p.setSpacingAfter(4f);
                                contentDoc.add(p);
                            }
                        }
                    }
                }
            }

            contentDoc.close();
            byte[] contentBytes = contentBaos.toByteArray();

            // ===== PASSO 2: GERAR TOC =====
            ByteArrayOutputStream tocBaos = new ByteArrayOutputStream();
            Document tocDoc = new Document(PageSize.A4, 36, 36, 48, 48);
            PdfWriter.getInstance(tocDoc, tocBaos);
            tocDoc.open();
            Paragraph tocTitle = new Paragraph("Sumário", h1);
            tocTitle.setSpacingAfter(8f);
            tocDoc.add(tocTitle);

            PdfPTable tocTable = new PdfPTable(new float[]{9, 1});
            tocTable.setWidthPercentage(100);
            for (TocEntry e : tocEntries) {
                PdfPCell left = new PdfPCell(new Phrase(e.title, text));
                left.setBorder(Rectangle.NO_BORDER);
                PdfPCell right = new PdfPCell(new Phrase(String.valueOf(e.page), text));
                right.setHorizontalAlignment(Element.ALIGN_RIGHT);
                right.setBorder(Rectangle.NO_BORDER);
                tocTable.addCell(left);
                tocTable.addCell(right);
            }
            tocDoc.add(tocTable);
            tocDoc.close();
            int tocPages = new PdfReader(tocBaos.toByteArray()).getNumberOfPages();

            // ===== PASSO 3: PDF FINAL =====
            ByteArrayOutputStream finalBaos = new ByteArrayOutputStream();
            Document finalDoc = new Document(PageSize.A4, 36, 36, 48, 48);
            PdfWriter finalWriter = PdfWriter.getInstance(finalDoc, finalBaos);
            finalWriter.setPageEvent(new FooterEvent(doc.company != null ? doc.company : commercialBrandingService.nameUpper()));
            finalDoc.open();

            Paragraph tocTitle2 = new Paragraph("Sumário", h1);
            tocTitle2.setSpacingAfter(8f);
            finalDoc.add(tocTitle2);

            PdfPTable tocTable2 = new PdfPTable(new float[]{9, 1});
            tocTable2.setWidthPercentage(100);
            for (TocEntry e : tocEntries) {
                PdfPCell left = new PdfPCell(new Phrase(e.title, text));
                left.setBorder(Rectangle.NO_BORDER);
                PdfPCell right = new PdfPCell(new Phrase(String.valueOf(e.page + tocPages), text));
                right.setHorizontalAlignment(Element.ALIGN_RIGHT);
                right.setBorder(Rectangle.NO_BORDER);
                tocTable2.addCell(left);
                tocTable2.addCell(right);
            }
            finalDoc.add(tocTable2);

            PdfReader reader = new PdfReader(contentBytes);
            PdfContentByte cb = finalWriter.getDirectContent();
            for (int i = 1; i <= reader.getNumberOfPages(); i++) {
                finalDoc.newPage();
                PdfImportedPage page = finalWriter.getImportedPage(reader, i);
                cb.addTemplate(page, 0, 0);
            }

            finalDoc.close();
            return finalBaos.toByteArray();

        } catch (Exception e) {
            throw new RuntimeException(ApiI18nMessages.withDetail(ApiI18nMessages.FCU_ASSEMBLY_EXPORT_PDF_FAILED, e.getMessage()), e);
        }
    }

    private void addMeta(PdfPTable meta, String label, String value) {
        PdfPCell c1 = new PdfPCell(new Phrase(label != null ? label : "",
                FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
        PdfPCell c2 = new PdfPCell(new Phrase(value != null ? value : "",
                FontFactory.getFont(FontFactory.HELVETICA, 9)));
        c1.setBorder(Rectangle.BOX);
        c2.setBorder(Rectangle.BOX);
        meta.addCell(c1);
        meta.addCell(c2);
    }

    private String kindPrefix(String kind) {
        if (kind == null) return "";
        switch (kind.toLowerCase()) {
            case "warning": return "ADVERTÊNCIA: ";
            case "caution": return "CUIDADO: ";
            case "note":    return "NOTA: ";
            case "figure":  return "FIGURA: ";
            default:        return "PASSO: ";
        }
    }

    private PdfPTable mdToTable(String md) {
        if (md == null || md.isBlank()) return null;
        String[] lines = md.split("\\r?\\n");
        if (lines.length < 2) return null;

        String[] header = splitRow(lines[0]);
        int cols = header.length;
        PdfPTable t = new PdfPTable(cols);
        t.setWidthPercentage(100);

        for (String h : header) {
            PdfPCell ch = new PdfPCell(new Phrase(h.trim(),
                    FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9)));
            t.addCell(ch);
        }

        for (int i = 2; i < lines.length; i++) {
            String[] cells = splitRow(lines[i]);
            for (int c = 0; c < cols; c++) {
                String val = c < cells.length ? cells[c].trim() : "";
                t.addCell(new Phrase(val, FontFactory.getFont(FontFactory.HELVETICA, 9)));
            }
        }
        return t;
    }

    private String[] splitRow(String row) {
        String r = row.trim();
        if (r.startsWith("|")) r = r.substring(1);
        if (r.endsWith("|")) r = r.substring(0, r.length() - 1);
        String[] parts = r.split("\\|");
        for (int i = 0; i < parts.length; i++) {
            parts[i] = parts[i].replaceAll("^\\s+|\\s+$", "");
        }
        return parts;
    }
}
