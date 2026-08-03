package com.aerosuite.studio;

import com.aerosuite.i18n.ApiI18nMessages;

import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.rendering.ImageType;
import org.apache.pdfbox.rendering.PDFRenderer;

import javax.imageio.ImageIO;
import java.awt.Graphics2D;
import java.awt.RenderingHints;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;

/**
 * Gera PNG de pré-visualização a partir da primeira página do PDF (Aero Studio).
 */
public final class AeroStudioPdfPreviewUtil {

    private AeroStudioPdfPreviewUtil() {}

    public static byte[] firstPageToPng(byte[] pdfBytes, int dpi) throws Exception {
        if (pdfBytes == null || pdfBytes.length == 0) {
            throw new IllegalArgumentException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_PDF_EMPTY));
        }
        int safeDpi = Math.min(200, Math.max(72, dpi));
        try (PDDocument doc = PDDocument.load(pdfBytes)) {
            if (doc.getNumberOfPages() < 1) {
                throw new IllegalStateException(ApiI18nMessages.encode(ApiI18nMessages.STUDIO_PDF_NO_PAGES));
            }
            PDFRenderer renderer = new PDFRenderer(doc);
            BufferedImage image = renderer.renderImageWithDPI(0, safeDpi, ImageType.RGB);
            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            ImageIO.write(image, "PNG", baos);
            return baos.toByteArray();
        }
    }

    /** Reduz imagem se a largura exceder maxWidthPx (útil para pré-visualização na UI). */
    public static byte[] scalePngMaxWidth(byte[] pngBytes, int maxWidthPx) throws Exception {
        if (pngBytes == null || maxWidthPx <= 0) {
            return pngBytes;
        }
        BufferedImage src = ImageIO.read(new java.io.ByteArrayInputStream(pngBytes));
        if (src == null || src.getWidth() <= maxWidthPx) {
            return pngBytes;
        }
        int h = (int) ((long) src.getHeight() * maxWidthPx / src.getWidth());
        BufferedImage dst = new BufferedImage(maxWidthPx, Math.max(1, h), BufferedImage.TYPE_INT_RGB);
        Graphics2D g = dst.createGraphics();
        g.setRenderingHint(RenderingHints.KEY_INTERPOLATION, RenderingHints.VALUE_INTERPOLATION_BILINEAR);
        g.drawImage(src, 0, 0, maxWidthPx, h, null);
        g.dispose();
        ByteArrayOutputStream baos = new ByteArrayOutputStream();
        ImageIO.write(dst, "PNG", baos);
        return baos.toByteArray();
    }
}
