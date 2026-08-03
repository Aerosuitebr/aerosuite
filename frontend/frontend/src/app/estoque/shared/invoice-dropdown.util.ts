import { Invoice } from '../../core/estoque.service';
import { formatIsoDateDisplay } from '../../core/locale/iso-local-date.util';

export type InvoiceParaDropdown = Invoice & { rotuloSelecao: string };
export function formatarDataInvoiceIso(iso?: string): string {
  return formatIsoDateDisplay(iso);
}

/** Rótulo: INV-123 · Pendente · 15/03/2025 · #42 */
export function formatInvoiceRotuloSelecao(
  inv: Invoice,
  statusLabel: (status?: string) => string
): string {
  const numero = (inv.numeroInvoice || '').trim() || '—';
  const status = statusLabel(inv.status);
  const data = formatarDataInvoiceIso(inv.dataEmissao);
  const idPart = inv.id != null ? `#${inv.id}` : '';
  const parts = [numero, status];
  if (data) parts.push(data);
  if (idPart) parts.push(idPart);
  return parts.join(' · ');
}

export function mapInvoicesParaDropdown(
  invoices: Invoice[],
  statusLabel: (status?: string) => string
): InvoiceParaDropdown[] {
  return invoices.map(inv => ({
    ...inv,
    rotuloSelecao: formatInvoiceRotuloSelecao(inv, statusLabel)
  }));
}
