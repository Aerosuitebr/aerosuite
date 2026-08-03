package com.aerosuite.service;

import com.aerosuite.domain.ConformidadeTreinamento;
import com.aerosuite.domain.Usuario;
import com.aerosuite.i18n.ApiI18nMessages;
import com.aerosuite.util.PanacheMaps;
import com.lowagie.text.*;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.ws.rs.BadRequestException;
import jakarta.ws.rs.NotFoundException;

import java.io.ByteArrayOutputStream;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.stream.Collectors;

@ApplicationScoped
public class ConformidadeTreinamentoListaPresencaService {

    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    public byte[] gerarPdf(String turmaRef) {
        if (turmaRef == null || turmaRef.isBlank()) {
            throw new BadRequestException(ApiI18nMessages.domain("treinamento.error.turma_obrigatoria"));
        }
        String ref = turmaRef.trim();
        List<ConformidadeTreinamento> rows =
                ConformidadeTreinamento.find("ativo = true and turmaRef = ?1 order by curso, usuarioId", ref).list();
        if (rows.isEmpty()) {
            throw new NotFoundException(ApiI18nMessages.domain("treinamento.error.turma_sem_registros"));
        }
        Set<Integer> usuarioIds =
                rows.stream().map(r -> r.usuarioId).filter(id -> id != null).collect(Collectors.toSet());
        Map<Integer, Usuario> usuarios =
                usuarioIds.isEmpty()
                        ? Map.of()
                        : PanacheMaps.byId(Usuario.list("id in ?1", usuarioIds), u -> u.id);

        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        try {
            Document doc = new Document(PageSize.A4, 48, 48, 56, 48);
            PdfWriter.getInstance(doc, baos);
            doc.open();

            Font titleFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 14);
            Font metaFont = FontFactory.getFont(FontFactory.HELVETICA, 10);
            Font headFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9);
            Font cellFont = FontFactory.getFont(FontFactory.HELVETICA, 9);

            doc.add(new Paragraph("Lista de presença — treinamento", titleFont));
            doc.add(new Paragraph("Turma: " + ref, metaFont));
            doc.add(new Paragraph("Gerado em: " + LocalDateTime.now().format(DT), metaFont));
            doc.add(Chunk.NEWLINE);

            PdfPTable table = new PdfPTable(new float[] {3f, 4f, 2f, 2f});
            table.setWidthPercentage(100);
            addHeader(table, "Participante", headFont);
            addHeader(table, "Curso", headFont);
            addHeader(table, "Presente", headFont);
            addHeader(table, "Validade", headFont);

            for (ConformidadeTreinamento row : rows) {
                Usuario u = row.usuarioId != null ? usuarios.get(row.usuarioId) : null;
                String nome = u != null ? (u.nome != null ? u.nome : u.email) : String.valueOf(row.usuarioId);
                addCell(table, nome, cellFont);
                addCell(table, row.curso != null ? row.curso : "—", cellFont);
                addCell(table, Boolean.TRUE.equals(row.presenteLista) ? "Sim" : "Não", cellFont);
                addCell(
                        table,
                        row.dataValidade != null ? row.dataValidade.toString() : "—",
                        cellFont);
            }
            doc.add(table);
            doc.close();
            return baos.toByteArray();
        } catch (DocumentException e) {
            throw new IllegalStateException("Falha ao gerar PDF lista de presença", e);
        } finally {
            try {
                baos.close();
            } catch (java.io.IOException ignored) {
                // ByteArrayOutputStream close is no-op
            }
        }
    }

    private static void addHeader(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text, font));
        cell.setBackgroundColor(new java.awt.Color(230, 236, 245));
        cell.setPadding(6);
        table.addCell(cell);
    }

    private static void addCell(PdfPTable table, String text, Font font) {
        PdfPCell cell = new PdfPCell(new Phrase(text != null ? text : "—", font));
        cell.setPadding(5);
        table.addCell(cell);
    }
}
