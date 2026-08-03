import { InvoiceItem } from '../../core/estoque.service';

export type InvoiceItemParaDropdown = InvoiceItem & { rotuloSelecao: string };

/** Linha · P/N · descrição · pend. qtd */
export function formatInvoiceItemRotuloSelecao(item: InvoiceItem): string {
  const linha = item.linha != null ? `#${item.linha}` : '—';
  const pn = (item.partNumber || '').trim() || '—';
  const parts = [linha, pn];
  const desc = (item.descricao || '').trim();
  if (desc) parts.push(desc);
  const pend = item.quantidadePendente != null ? Number(item.quantidadePendente) : null;
  if (pend != null && !Number.isNaN(pend)) {
    parts.push(`pend. ${pend}`);
  }
  return parts.join(' · ');
}

/** Linhas ainda abertas para recebimento (Pendente / Parcial ou quantidade pendente > 0). */
export function filtrarItensInvoiceAbertos(itens: InvoiceItem[]): InvoiceItem[] {
  return itens.filter(it => {
    if (it.status === 'COMPLETO') return false;
    const pend = Number(it.quantidadePendente ?? 0);
    if (pend > 0) return true;
    if (it.status === 'PENDENTE' || it.status === 'PARCIAL') return true;
    const qtd = Number(it.quantidade ?? 0);
    const rec = Number(it.quantidadeRecebida ?? 0);
    return qtd > rec;
  });
}

export function mapItensInvoiceParaDropdown(itens: InvoiceItem[]): InvoiceItemParaDropdown[] {
  return filtrarItensInvoiceAbertos(itens)
    .sort((a, b) => (a.linha ?? 0) - (b.linha ?? 0))
    .map(it => ({
      ...it,
      rotuloSelecao: formatInvoiceItemRotuloSelecao(it)
    }));
}
