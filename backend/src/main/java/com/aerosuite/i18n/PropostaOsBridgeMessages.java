package com.aerosuite.i18n;

import com.aerosuite.domain.PropostaComercial;
import com.aerosuite.domain.PropostaComercialItem;
import java.util.List;

/** Textos da observação inicial da OS gerada a partir de proposta comercial (4 locales). */
public final class PropostaOsBridgeMessages {

    private record Labels(
            String origem,
            String servico,
            String observacoes,
            String itens,
            String produto,
            String qtd,
            String pn) {}

    private PropostaOsBridgeMessages() {}

    public static String buildObsIniServ(
            PropostaComercial proposta, List<PropostaComercialItem> itens, String locale) {
        Labels m = labels(PropostaComercialMessages.toLang(locale));
        StringBuilder sb = new StringBuilder();
        sb.append(m.origem()).append(' ').append(nullToEmpty(proposta.numeroProposta));
        if (!isBlank(proposta.servicoExecutado)) {
            sb.append("\n\n").append(m.servico()).append(' ').append(proposta.servicoExecutado.trim());
        }
        if (!isBlank(proposta.observacoes)) {
            sb.append("\n\n").append(m.observacoes()).append('\n').append(proposta.observacoes.trim());
        }
        if (itens != null && !itens.isEmpty()) {
            sb.append("\n\n").append(m.itens());
            for (PropostaComercialItem item : itens) {
                sb.append("\n- ");
                sb.append(nullToEmpty(item.produtoNome));
                if (item.quantidade != null) {
                    sb.append(" (").append(m.qtd()).append(' ').append(item.quantidade).append(')');
                }
                if (!isBlank(item.produtoPn)) {
                    sb.append(' ').append(m.pn()).append(' ').append(item.produtoPn.trim());
                }
            }
        }
        if (!isBlank(proposta.produtoNome) && (itens == null || itens.isEmpty())) {
            sb.append("\n\n").append(m.produto()).append(' ').append(proposta.produtoNome.trim());
        }
        return sb.toString();
    }

    private static Labels labels(PropostaComercialMessages.Lang lang) {
        return switch (lang) {
            case EN ->
                    new Labels(
                            "Source: commercial proposal",
                            "Service:",
                            "Proposal notes:",
                            "Proposal items:",
                            "Product:",
                            "qty",
                            "P/N");
            case ES ->
                    new Labels(
                            "Origen: propuesta comercial",
                            "Servicio:",
                            "Observaciones de la propuesta:",
                            "Ítems de la propuesta:",
                            "Producto:",
                            "cant.",
                            "P/N");
            case FR ->
                    new Labels(
                            "Origine : proposition commerciale",
                            "Service :",
                            "Remarques de la proposition :",
                            "Articles de la proposition :",
                            "Produit :",
                            "qté",
                            "P/N");
            default ->
                    new Labels(
                            "Origem: proposta comercial",
                            "Serviço:",
                            "Observações da proposta:",
                            "Itens da proposta:",
                            "Produto:",
                            "qtd",
                            "P/N");
        };
    }

    private static String nullToEmpty(String s) {
        return s == null ? "" : s;
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }
}
