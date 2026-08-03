package com.aerosuite.util;

/**
 * HTML do emitente (dados fiscais da empresa) para e-mails e PDFs de proposta comercial.
 */
public final class EmitenteFiscalHtmlFormatter {

    private EmitenteFiscalHtmlFormatter() {}

    public static String escapeHtml(String s) {
        if (s == null || s.isEmpty()) {
            return "";
        }
        return s.replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }

    /**
     * @param wrapperStyle estilos CSS do contentor externo (ex.: cor, margem)
     * @param lineStyle    estilos CSS de cada linha
     */
    public static String buildHtml(
            boolean onboardingCompleto,
            String razaoSocial,
            String cnpj,
            String inscricaoEstadual,
            String inscricaoMunicipal,
            String emailNfe,
            String enderecoLogradouro,
            String enderecoNumero,
            String enderecoComplemento,
            String enderecoBairro,
            String cidade,
            String uf,
            String cep,
            String telefone,
            String siteUrl,
            String supportEmail,
            String wrapperStyle,
            String lineStyle) {
        if (!onboardingCompleto) {
            return "";
        }
        String rz = trim(razaoSocial);
        if (rz.isEmpty()) {
            return "";
        }
        StringBuilder sb = new StringBuilder();
        sb.append("<div style=\"").append(wrapperStyle).append("\">");
        line(sb, lineStyle, rz);
        String cnpjLine = trim(cnpj);
        if (!cnpjLine.isEmpty()) {
            line(sb, lineStyle, "CNPJ: " + cnpjLine);
        }
        String ie = trim(inscricaoEstadual);
        if (!ie.isEmpty()) {
            line(sb, lineStyle, "Inscr. estadual: " + ie);
        }
        String im = trim(inscricaoMunicipal);
        if (!im.isEmpty()) {
            line(sb, lineStyle, "Inscr. municipal: " + im);
        }
        String nfe = trim(emailNfe);
        if (!nfe.isEmpty()) {
            line(sb, lineStyle, "E-mail NF-e: " + nfe);
        }
        String end = EmitenteFiscalHtmlFormatter.formatEnderecoSingleLine(
                trim(enderecoLogradouro),
                trim(enderecoNumero),
                trim(enderecoComplemento),
                trim(enderecoBairro),
                trim(cidade),
                trim(uf),
                trim(cep));
        if (!end.isEmpty()) {
            line(sb, lineStyle, end);
        }
        String tel = trim(telefone);
        if (!tel.isEmpty()) {
            line(sb, lineStyle, "Tel.: " + tel);
        }
        String mail = trim(supportEmail);
        if (!mail.isEmpty()) {
            line(sb, lineStyle, mail);
        }
        String site = trim(siteUrl);
        if (!site.isEmpty()) {
            String esc = escapeHtml(site);
            line(sb, lineStyle, "<a href=\"" + esc + "\" style=\"color:inherit;text-decoration:underline;\">" + esc + "</a>");
        }
        sb.append("</div>");
        return sb.toString();
    }

    private static void line(StringBuilder sb, String lineStyle, String content) {
        sb.append("<div style=\"").append(lineStyle).append("\">");
        if (content.contains("<a ")) {
            sb.append(content);
        } else {
            sb.append(escapeHtml(content));
        }
        sb.append("</div>");
    }

    public static String formatEnderecoSingleLine(
            String logradouro,
            String numero,
            String complemento,
            String bairro,
            String cidade,
            String uf,
            String cep) {
        StringBuilder b = new StringBuilder();
        if (!logradouro.isEmpty()) {
            b.append(logradouro);
        }
        if (!numero.isEmpty()) {
            if (b.length() > 0) {
                b.append(", ");
            }
            b.append(numero);
        }
        if (!complemento.isEmpty()) {
            if (b.length() > 0) {
                b.append(" — ");
            }
            b.append(complemento);
        }
        if (!bairro.isEmpty()) {
            if (b.length() > 0) {
                b.append(" — ");
            }
            b.append(bairro);
        }
        if (!cidade.isEmpty() || !uf.isEmpty()) {
            if (b.length() > 0) {
                b.append(" — ");
            }
            b.append(cidade);
            if (!cidade.isEmpty() && !uf.isEmpty()) {
                b.append("/");
            }
            b.append(uf);
        }
        if (!cep.isEmpty()) {
            if (b.length() > 0) {
                b.append(" — CEP ");
            } else {
                b.append("CEP ");
            }
            b.append(cep);
        }
        return b.toString();
    }

    private static String trim(String s) {
        return s == null ? "" : s.trim();
    }
}
