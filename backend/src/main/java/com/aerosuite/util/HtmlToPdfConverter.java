package com.aerosuite.util;

import com.openhtmltopdf.pdfboxout.PdfRendererBuilder;
import jakarta.enterprise.context.ApplicationScoped;

import java.io.ByteArrayOutputStream;

/**
 * Converte HTML (XHTML tolerante) em PDF A4 via OpenHTMLToPDF.
 */
@ApplicationScoped
public class HtmlToPdfConverter {

    public byte[] toPdf(String html) throws Exception {
        if (html == null) {
            html = "";
        }
        html = normalizeHtmlToXhtml(html);
        ByteArrayOutputStream os = new ByteArrayOutputStream();
        PdfRendererBuilder builder = new PdfRendererBuilder();
        builder.useDefaultPageSize(210, 297, PdfRendererBuilder.PageSizeUnits.MM);
        builder.withHtmlContent(html, "");
        builder.useFastMode();
        builder.toStream(os);
        builder.run();
        return os.toByteArray();
    }

    public static String escapeHtml(String text) {
        if (text == null) {
            return "";
        }
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;")
                .replace("'", "&#39;");
    }

    private static String normalizeHtmlToXhtml(String html) {
        html = html.replaceAll("<img([^>]*?)(?<!/)>", "<img$1 />");
        html = html.replaceAll("<br(?<!/)>", "<br />");
        html = html.replaceAll("<hr(?<!/)>", "<hr />");
        html = html.replaceAll("<input([^>]*?)(?<!/)>", "<input$1 />");
        html = html.replaceAll("<meta([^>]*?)(?<!/)>", "<meta$1 />");
        html = html.replaceAll("<link([^>]*?)(?<!/)>", "<link$1 />");
        return html;
    }
}
