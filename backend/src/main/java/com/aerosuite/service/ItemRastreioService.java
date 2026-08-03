package com.aerosuite.service;

import com.aerosuite.domain.ItemEstoque;
import com.aerosuite.domain.Lote;
import com.aerosuite.domain.MovimentacaoEstoque;
import com.aerosuite.domain.OS;
import com.aerosuite.dto.ItemEstoqueDto;
import com.aerosuite.dto.ItemLinhaTempoDto;
import com.aerosuite.rastreio.ItemRastreioLabels;
import com.aerosuite.util.HtmlToPdfConverter;
import jakarta.enterprise.context.ApplicationScoped;
import jakarta.inject.Inject;
import jakarta.ws.rs.NotFoundException;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@ApplicationScoped
public class ItemRastreioService {

    private static final int MAX_EVENTOS = 500;
    private static final DateTimeFormatter DT = DateTimeFormatter.ofPattern("dd/MM/yyyy HH:mm");

    @Inject
    EstoqueService estoqueService;

    @Inject
    HtmlToPdfConverter htmlToPdfConverter;

    public ItemLinhaTempoDto linhaTempoPorCodigo(String codigo) {
        ItemEstoqueDto item = estoqueService.buscarItemPorCodigoRastreio(codigo);
        return linhaTempoPorItemId(item.id);
    }

    public ItemLinhaTempoDto linhaTempoPorItemId(Long itemId) {
        ItemEstoque item = ItemEstoque.findById(itemId);
        if (item == null || !Boolean.TRUE.equals(item.isActive)) {
            throw new NotFoundException(com.aerosuite.i18n.ApiI18nMessages.encode("estoque.error.item_rastreio_not_found"));
        }

        ItemLinhaTempoDto dto = new ItemLinhaTempoDto();
        dto.item = toResumo(item);
        List<MovimentacaoEstoque> movs =
                MovimentacaoEstoque.list(
                        "itemEstoqueId = ?1 order by dataMovimentacao desc, id desc", item.id);
        if (movs.size() > MAX_EVENTOS) {
            movs = movs.subList(0, MAX_EVENTOS);
        }
        Map<Long, Integer> osNumeroCache = new HashMap<>();
        for (MovimentacaoEstoque mov : movs) {
            dto.eventos.add(toEvento(mov, osNumeroCache));
        }
        dto.totalEventos = dto.eventos.size();
        return dto;
    }

    public byte[] exportPdfPorCodigo(String codigo, String locale) throws Exception {
        ItemLinhaTempoDto data = linhaTempoPorCodigo(codigo);
        ItemRastreioLabels labels = ItemRastreioLabels.forLocale(locale);
        return htmlToPdfConverter.toPdf(buildHtml(data, labels));
    }

    public String suggestedFileName(ItemLinhaTempoDto data) {
        String cod = data.item != null && data.item.codigoRastreio != null ? data.item.codigoRastreio : "item";
        return "Rastreio_" + cod.replaceAll("[^a-zA-Z0-9_-]", "_") + ".pdf";
    }

    private ItemLinhaTempoDto.ItemResumo toResumo(ItemEstoque item) {
        ItemLinhaTempoDto.ItemResumo r = new ItemLinhaTempoDto.ItemResumo();
        r.id = item.id;
        r.codigoRastreio = item.codigoRastreio;
        r.partNumber = item.partNumber;
        r.serialNumber = item.serialNumber;
        r.descricao = item.descricao;
        r.status = item.status != null ? item.status.name() : null;
        r.certificadoConformidade = item.certificadoConformidade;
        r.dataValidade = item.dataValidade != null ? item.dataValidade.toString() : null;
        r.localizacao = item.localizacao;
        if (item.lote != null) {
            r.loteCodigo = item.lote.codigoLote;
        } else if (item.loteId != null) {
            Lote lote = Lote.findById(item.loteId);
            if (lote != null) {
                r.loteCodigo = lote.codigoLote;
            }
        }
        if (item.invoice != null) {
            r.invoiceNumero = item.invoice.numeroInvoice;
        }
        if (item.fornecedor != null) {
            r.fornecedorNome = item.fornecedor.razaoSocial;
        }
        if (item.osId != null) {
            r.osConsumoId = item.osId;
            r.osConsumoNumero = resolveOsNumero(item.osId, new HashMap<>());
        }
        return r;
    }

    private ItemLinhaTempoDto.LinhaTempoEventoDto toEvento(
            MovimentacaoEstoque mov, Map<Long, Integer> osNumeroCache) {
        ItemLinhaTempoDto.LinhaTempoEventoDto e = new ItemLinhaTempoDto.LinhaTempoEventoDto();
        e.movimentacaoId = mov.id;
        e.tipo = mov.tipoMovimentacao != null ? mov.tipoMovimentacao.name() : null;
        e.dataHora = fmt(mov.dataMovimentacao);
        e.quantidade = mov.quantidade != null ? mov.quantidade.toPlainString() : null;
        e.quantidadeAnterior = mov.quantidadeAnterior != null ? mov.quantidadeAnterior.toPlainString() : null;
        e.quantidadePosterior = mov.quantidadePosterior != null ? mov.quantidadePosterior.toPlainString() : null;
        e.usuarioNome = mov.usuarioNome;
        e.motivo = mov.motivo;
        e.origemSaida = mov.origemSaida;
        e.localizacaoOrigem = mov.localizacaoOrigem;
        e.localizacaoDestino = mov.localizacaoDestino;
        if (mov.osId != null) {
            e.osIdInterno = mov.osId;
            e.osNumero = resolveOsNumero(mov.osId, osNumeroCache);
        }
        return e;
    }

    private Integer resolveOsNumero(Long osRef, Map<Long, Integer> cache) {
        if (osRef == null) {
            return null;
        }
        if (cache.containsKey(osRef)) {
            return cache.get(osRef);
        }
        OS byId = OS.findById(osRef);
        if (byId != null) {
            cache.put(osRef, byId.idOs);
            return byId.idOs;
        }
        OS byNumero = OS.find("idOs = ?1", osRef.intValue()).firstResult();
        if (byNumero != null) {
            cache.put(osRef, byNumero.idOs);
            return byNumero.idOs;
        }
        cache.put(osRef, null);
        return null;
    }

    private String buildHtml(ItemLinhaTempoDto data, ItemRastreioLabels labels) {
        String generated = LocalDateTime.now().format(DT);
        StringBuilder html = new StringBuilder();
        html.append("<!DOCTYPE html><html><head><meta charset=\"UTF-8\"/><style>");
        html.append("body{font-family:Arial,Helvetica,sans-serif;font-size:10pt;color:#222;margin:24px;}");
        html.append("h1{font-size:16pt;margin:0 0 4px;} h2{font-size:12pt;margin:20px 0 8px;border-bottom:1px solid #ccc;}");
        html.append("table{width:100%;border-collapse:collapse;margin-bottom:12px;}");
        html.append("th,td{border:1px solid #ddd;padding:4px 6px;text-align:left;vertical-align:top;font-size:9pt;}");
        html.append("th{background:#f5f5f5;} .meta{color:#666;font-size:9pt;margin-bottom:16px;}");
        html.append(".kv td:first-child{font-weight:bold;width:30%;background:#fafafa;}");
        html.append(".checklist li{margin:4px 0;}");
        html.append("</style></head><body>");

        html.append("<h1>").append(HtmlToPdfConverter.escapeHtml(labels.title())).append("</h1>");
        html.append("<p class=\"meta\">")
                .append(HtmlToPdfConverter.escapeHtml(labels.generatedAt()))
                .append(": ")
                .append(HtmlToPdfConverter.escapeHtml(generated))
                .append("</p>");

        ItemLinhaTempoDto.ItemResumo item = data.item;
        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionItem())).append("</h2>");
        html.append("<table class=\"kv\">");
        appendKv(html, labels.codigoRastreio(), item.codigoRastreio);
        appendKv(html, labels.partNumber(), item.partNumber);
        appendKv(html, labels.serialNumber(), item.serialNumber);
        appendKv(html, labels.status(), item.status);
        appendKv(html, labels.certificado(), item.certificadoConformidade);
        appendKv(html, labels.validade(), item.dataValidade);
        appendKv(html, labels.lote(), item.loteCodigo);
        appendKv(html, labels.invoice(), item.invoiceNumero);
        appendKv(html, labels.fornecedor(), item.fornecedorNome);
        appendKv(html, labels.localizacao(), item.localizacao);
        if (item.osConsumoNumero != null) {
            appendKv(html, labels.osConsumo(), String.valueOf(item.osConsumoNumero));
        }
        html.append("</table>");

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionChecklist())).append("</h2>");
        html.append("<ul class=\"checklist\">");
        for (String line : labels.checklistLines()) {
            html.append("<li>").append(HtmlToPdfConverter.escapeHtml(line)).append("</li>");
        }
        html.append("</ul>");

        html.append("<h2>").append(HtmlToPdfConverter.escapeHtml(labels.sectionTimeline())).append("</h2>");
        if (data.eventos.isEmpty()) {
            html.append("<p>").append(HtmlToPdfConverter.escapeHtml(labels.noRecords())).append("</p>");
        } else {
            html.append("<table><tr>");
            html.append("<th>").append(HtmlToPdfConverter.escapeHtml(labels.colDate())).append("</th>");
            html.append("<th>").append(HtmlToPdfConverter.escapeHtml(labels.colType())).append("</th>");
            html.append("<th>").append(HtmlToPdfConverter.escapeHtml(labels.colQty())).append("</th>");
            html.append("<th>").append(HtmlToPdfConverter.escapeHtml(labels.colOs())).append("</th>");
            html.append("<th>").append(HtmlToPdfConverter.escapeHtml(labels.colUser())).append("</th>");
            html.append("<th>").append(HtmlToPdfConverter.escapeHtml(labels.colDetail())).append("</th>");
            html.append("</tr>");
            for (ItemLinhaTempoDto.LinhaTempoEventoDto ev : data.eventos) {
                html.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(nvl(ev.dataHora, "")));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(ev.tipo, "")));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(ev.quantidade, "")));
                html.append("</td><td>").append(
                        HtmlToPdfConverter.escapeHtml(ev.osNumero != null ? String.valueOf(ev.osNumero) : "—"));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(ev.usuarioNome, "")));
                html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(trunc(nvl(ev.motivo, ""), 120)));
                html.append("</td></tr>");
            }
            html.append("</table>");
        }

        html.append("</body></html>");
        return html.toString();
    }

    private static void appendKv(StringBuilder html, String label, String value) {
        html.append("<tr><td>").append(HtmlToPdfConverter.escapeHtml(label));
        html.append("</td><td>").append(HtmlToPdfConverter.escapeHtml(nvl(value, "—")));
        html.append("</td></tr>");
    }

    private static String nvl(String a, String b) {
        if (a != null && !a.isBlank()) {
            return a;
        }
        return b != null ? b : "";
    }

    private static String fmt(LocalDateTime dt) {
        return dt != null ? dt.format(DT) : "";
    }

    private static String trunc(String s, int max) {
        if (s == null) {
            return "";
        }
        return s.length() <= max ? s : s.substring(0, max) + "…";
    }
}
