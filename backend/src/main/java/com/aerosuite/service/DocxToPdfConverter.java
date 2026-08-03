package com.aerosuite.service;

import com.aerosuite.i18n.ApiI18nMessages;

import org.jboss.logging.Logger;
import jakarta.enterprise.context.ApplicationScoped;
import org.apache.poi.xwpf.usermodel.*;
import com.lowagie.text.DocumentException;
import com.lowagie.text.Font;
import com.lowagie.text.FontFactory;
import com.lowagie.text.Image;
import com.lowagie.text.PageSize;
import com.lowagie.text.Paragraph;
import com.lowagie.text.Chunk;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfWriter;

import java.io.*;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

@ApplicationScoped
public class DocxToPdfConverter {

    private static final Logger LOG = Logger.getLogger(DocxToPdfConverter.class);
    
    /**
     * Converte um arquivo DOCX para PDF
     * @param docxPath Caminho do arquivo DOCX
     * @param pdfPath Caminho de destino do PDF
     * @throws Exception Se houver erro na conversão
     */
    public void convertDocxToPdf(Path docxPath, Path pdfPath) throws Exception {
        if (!Files.exists(docxPath)) {
            throw new FileNotFoundException(ApiI18nMessages.encode(ApiI18nMessages.FILE_DOCX_NOT_FOUND, "path", docxPath.toString()));
        }
        
        // Criar diretório de destino se não existir
        Files.createDirectories(pdfPath.getParent());
        
        try (FileInputStream fis = new FileInputStream(docxPath.toFile());
             XWPFDocument document = new XWPFDocument(fis);
             FileOutputStream fos = new FileOutputStream(pdfPath.toFile())) {
            
            com.lowagie.text.Document pdfDoc = new com.lowagie.text.Document(PageSize.A4, 72, 72, 72, 72);
            PdfWriter.getInstance(pdfDoc, fos);
            pdfDoc.open();
            
            // Processar todos os elementos do documento (parágrafos, tabelas, etc.)
            List<IBodyElement> bodyElements = document.getBodyElements();
            
            for (IBodyElement element : bodyElements) {
                if (element instanceof XWPFParagraph) {
                    XWPFParagraph paragraph = (XWPFParagraph) element;
                    addParagraphToPdf(pdfDoc, paragraph);
                } else if (element instanceof XWPFTable) {
                    XWPFTable table = (XWPFTable) element;
                    addTableToPdf(pdfDoc, table);
                }
            }
            
            pdfDoc.close();
        }
    }
    
    /**
     * Adiciona um parágrafo DOCX ao PDF (incluindo imagens)
     */
    private void addParagraphToPdf(com.lowagie.text.Document pdfDoc, XWPFParagraph paragraph) throws DocumentException {
        List<XWPFRun> runs = paragraph.getRuns();
        
        // Verificar se há imagens ou texto no parágrafo
        boolean hasImages = false;
        boolean hasText = false;
        
        for (XWPFRun run : runs) {
            if (run.getEmbeddedPictures() != null && !run.getEmbeddedPictures().isEmpty()) {
                hasImages = true;
            }
            if (run.getText(0) != null && !run.getText(0).trim().isEmpty()) {
                hasText = true;
            }
        }
        
        // Se não há texto nem imagens, adicionar espaço em branco
        if (!hasText && !hasImages) {
            pdfDoc.add(new Paragraph(" "));
            return;
        }
        
        // Processar runs (texto e imagens)
        Paragraph pdfParagraph = new Paragraph();
        
        for (XWPFRun run : runs) {
            // Processar imagens no run
            List<XWPFPicture> pictures = run.getEmbeddedPictures();
            if (pictures != null && !pictures.isEmpty()) {
                for (XWPFPicture picture : pictures) {
                    try {
                        XWPFPictureData pictureData = picture.getPictureData();
                        if (pictureData != null) {
                            byte[] imageData = pictureData.getData();
                            if (imageData != null && imageData.length > 0) {
                                Image img = Image.getInstance(imageData);
                                
                                // Ajustar tamanho da imagem para caber na página
                                float maxWidth = PageSize.A4.getWidth() - 144; // Margens
                                float maxHeight = PageSize.A4.getHeight() / 2;
                                
                                if (img.getWidth() > maxWidth || img.getHeight() > maxHeight) {
                                    img.scaleToFit(maxWidth, maxHeight);
                                }
                                
                                img.setAlignment(Image.MIDDLE);
                                img.setSpacingAfter(6f);
                                img.setSpacingBefore(6f);
                                
                                // Se já há conteúdo no parágrafo, adicionar o parágrafo primeiro
                                if (pdfParagraph.size() > 0) {
                                    pdfDoc.add(pdfParagraph);
                                    pdfParagraph = new Paragraph();
                                }
                                
                                pdfDoc.add(img);
                            }
                        }
                    } catch (Exception e) {
                        LOG.warnf(e, "Erro ao processar imagem no parágrafo: %s", e.getMessage());
                        LOG.warnf(e, "Erro inesperado");
                    }
                }
            }
            
            // Processar texto no run
            String runText = run.getText(0);
            if (runText != null && !runText.isEmpty()) {
                Font font = getFontFromRun(run);
                pdfParagraph.add(new Chunk(runText, font));
            }
        }
        
        // Adicionar parágrafo se tiver conteúdo
        if (pdfParagraph.size() > 0) {
            pdfDoc.add(pdfParagraph);
        }
    }
    
    /**
     * Obtém a fonte baseada na formatação do run
     */
    private Font getFontFromRun(XWPFRun run) {
        // Obter tamanho da fonte
        int fontSize = 12; // Tamanho padrão
        try {
            Double runFontSize = run.getFontSizeAsDouble();
            if (runFontSize != null && runFontSize > 0) {
                fontSize = Math.max(1, Math.round(runFontSize.floatValue()));
            }
        } catch (Exception e) {
            fontSize = 12;
        }
        
        String fontFamily = FontFactory.HELVETICA;
        int fontStyle = Font.NORMAL;
        
        if (run.isBold()) {
            fontStyle |= Font.BOLD;
        }
        if (run.isItalic()) {
            fontStyle |= Font.ITALIC;
        }
        
        return FontFactory.getFont(fontFamily, fontSize, fontStyle);
    }
    
    /**
     * Adiciona uma tabela DOCX ao PDF (incluindo imagens nas células)
     */
    private void addTableToPdf(com.lowagie.text.Document pdfDoc, XWPFTable table) throws DocumentException {
        List<XWPFTableRow> rows = table.getRows();
        if (rows.isEmpty()) {
            return;
        }
        
        // Determinar número de colunas
        int numColumns = rows.stream()
            .mapToInt(row -> row.getTableCells().size())
            .max()
            .orElse(1);
        
        PdfPTable pdfTable = new PdfPTable(numColumns);
        pdfTable.setWidthPercentage(100);
        pdfTable.setSpacingBefore(10f);
        pdfTable.setSpacingAfter(10f);
        
        for (XWPFTableRow row : rows) {
            List<XWPFTableCell> cells = row.getTableCells();
            
            for (int i = 0; i < numColumns; i++) {
                PdfPCell pdfCell;
                
                if (i < cells.size()) {
                    XWPFTableCell cell = cells.get(i);
                    String cellText = cell.getText();
                    
                    // Verificar se a célula tem imagens
                    List<XWPFParagraph> cellParagraphs = cell.getParagraphs();
                    boolean hasImages = false;
                    
                    for (XWPFParagraph cellPara : cellParagraphs) {
                        for (XWPFRun run : cellPara.getRuns()) {
                            if (run.getEmbeddedPictures() != null && !run.getEmbeddedPictures().isEmpty()) {
                                hasImages = true;
                                break;
                            }
                        }
                        if (hasImages) break;
                    }
                    
                    if (hasImages) {
                        // Célula com imagens - criar parágrafo composto
                        Paragraph cellPara = new Paragraph();
                        if (cellText != null && !cellText.trim().isEmpty()) {
                            cellPara.add(new Chunk(cellText.trim() + "\n", 
                                FontFactory.getFont(FontFactory.HELVETICA, 10)));
                        }
                        
                        // Adicionar imagens da célula
                        for (XWPFParagraph cellPara2 : cellParagraphs) {
                            for (XWPFRun run : cellPara2.getRuns()) {
                                List<XWPFPicture> pictures = run.getEmbeddedPictures();
                                if (pictures != null && !pictures.isEmpty()) {
                                    for (XWPFPicture picture : pictures) {
                                        try {
                                            XWPFPictureData pictureData = picture.getPictureData();
                                            if (pictureData != null) {
                                                byte[] imageData = pictureData.getData();
                                                if (imageData != null && imageData.length > 0) {
                                                    Image img = Image.getInstance(imageData);
                                                    img.scaleToFit(100, 100); // Tamanho pequeno para célula
                                                    cellPara.add(new Chunk(img, 0, 0));
                                                }
                                            }
                                        } catch (Exception e) {
                                            LOG.warnf(e, "Erro ao processar imagem na célula: %s", e.getMessage());
                                        }
                                    }
                                }
                            }
                        }
                        
                        pdfCell = new PdfPCell(cellPara);
                    } else {
                        // Célula apenas com texto
                        if (cellText == null) {
                            cellText = "";
                        }
                        pdfCell = new PdfPCell(new Paragraph(cellText.trim(), 
                            FontFactory.getFont(FontFactory.HELVETICA, 10)));
                    }
                } else {
                    pdfCell = new PdfPCell(new Paragraph(""));
                }
                
                pdfCell.setPadding(5f);
                pdfTable.addCell(pdfCell);
            }
        }
        
        pdfDoc.add(pdfTable);
    }
    
    /**
     * Verifica se um arquivo é DOCX
     */
    public boolean isDocxFile(Path filePath) {
        String fileName = filePath.getFileName().toString().toLowerCase();
        return fileName.endsWith(".docx");
    }
}

