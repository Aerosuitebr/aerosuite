import { BrandingService } from '../../core/branding.service';
import { TranslationService } from '../../core/translation.service';
import { escapeHtml } from './etiqueta-padrao-100x45';

/** Abre janela e dispara impressão HTML da etiqueta (fallback navegador). Retorna false se o popup foi bloqueado. */
export function openEtiquetaHtmlPrint(html: string): boolean {
  const printWindow = window.open('', '_blank', 'noopener,noreferrer');
  if (!printWindow) return false;
  try {
    printWindow.document.write(html);
    printWindow.document.close();
    return true;
  } catch {
    printWindow.close();
    return false;
  }
}

export interface EtiquetaPrintLabels {
  noQr: string;
  titleFull: string;
  titleStandard: string;
  titleMedium: string;
  titleCompact: string;
  titleMinimal: string;
  supplier: string;
  origin: string;
  batch: string;
  invoice: string;
  location: string;
  shelf: string;
  prefixPn: string;
  prefixSn: string;
}

export interface EtiquetaPrintContext {
  commercialName: string;
  logoDataUri: string;
  labels: EtiquetaPrintLabels;
}

export function buildEtiquetaPrintContext(
  i18n: TranslationService,
  branding: BrandingService,
  logoDataUri: string
): EtiquetaPrintContext {
  const commercialName = escapeHtml(branding.snapshot().commercialName);
  return {
    commercialName,
    logoDataUri,
    labels: {
      noQr: escapeHtml(i18n.translate('estoque.etiqueta.print.noQr')),
      titleFull: escapeHtml(i18n.translate('estoque.etiqueta.print.titleFull')),
      titleStandard: escapeHtml(i18n.translate('estoque.etiqueta.print.titleStandard')),
      titleMedium: escapeHtml(i18n.translate('estoque.etiqueta.print.titleMedium')),
      titleCompact: escapeHtml(i18n.translate('estoque.etiqueta.print.titleCompact')),
      titleMinimal: escapeHtml(i18n.translate('estoque.etiqueta.print.titleMinimal')),
      supplier: escapeHtml(i18n.translate('estoque.etiqueta.print.label.supplier')),
      origin: escapeHtml(i18n.translate('estoque.etiqueta.print.label.origin')),
      batch: escapeHtml(i18n.translate('estoque.etiqueta.print.label.batch')),
      invoice: escapeHtml(i18n.translate('estoque.etiqueta.print.label.invoice')),
      location: escapeHtml(i18n.translate('estoque.etiqueta.print.label.location')),
      shelf: escapeHtml(i18n.translate('estoque.etiqueta.print.label.shelf')),
      prefixPn: escapeHtml(i18n.translate('estoque.consultaQr.prefixPn')),
      prefixSn: escapeHtml(i18n.translate('estoque.consultaQr.prefixSn'))
    }
  };
}

export function formatLoteLine(i18n: TranslationService, loteCodigo: string): string {
  return escapeHtml(i18n.translate('estoque.etiqueta.print.loteLine', { code: loteCodigo }));
}

export interface EtiquetaPrintItemInfo {
  serialNumber?: string | null;
  fornecedorNome?: string | null;
  fornecedorPais?: string | null;
  loteCodigo?: string | null;
  invoiceNumero?: string | null;
  localizacao?: string | null;
  prateleira?: string | null;
  gaveta?: string | null;
}

function qrPlaceholder(noQr: string, w: string, h: string, fontSize: string, margin = ''): string {
  return `<div style="width:${w};height:${h};border:0.3mm dashed #ccc;display:flex;align-items:center;justify-content:center;font-size:${fontSize};color:#888${margin}">${noQr}</div>`;
}

function shelfText(item: EtiquetaPrintItemInfo): string {
  return escapeHtml([item.prateleira, item.gaveta].filter(Boolean).join(' / ') || '-');
}

export function buildEtiquetaCompletaDocument(
  ctx: EtiquetaPrintContext,
  item: EtiquetaPrintItemInfo,
  codigoRastreio: string,
  partNumber: string,
  qrCodeUrl: string
): string {
  const L = ctx.labels;
  const codigo = escapeHtml(codigoRastreio);
  const pn = escapeHtml(partNumber);
  const sn = item.serialNumber ? escapeHtml(String(item.serialNumber)) : '';
  const pnJson = JSON.stringify(partNumber || '');
  const qrBlock = qrCodeUrl
    ? `<img src="${qrCodeUrl}" alt="QR Code">`
    : qrPlaceholder(L.noQr, '20mm', '20mm', '8px');
  return `<!DOCTYPE html><html><head>
      <title>${L.titleFull} - ${codigo}</title>
      <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
      <style>
        @page { size: 100mm 80mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 2mm; }
        .etiqueta { width: 96mm; height: 76mm; border: 0.5mm solid #000; padding: 3mm; background: white; }
        .empresa { font-weight: bold; font-size: 14px; text-align: center; border-bottom: 0.5mm solid #000; padding-bottom: 2mm; margin-bottom: 2mm; letter-spacing: 1px; display:flex; align-items:center; justify-content:center; gap:2mm; }
        .empresa img { width: 6mm; height: 6mm; }
        .codes-row { display: flex; justify-content: space-between; align-items: center; margin: 2mm 0; }
        .qr-box { text-align: center; }
        .qr-box img { width: 20mm; height: 20mm; border: 0.3mm solid #ccc; display: block; }
        .barcode-box svg { height: 15mm; }
        .codigo { font-family: monospace; font-size: 11px; text-align: center; background: #f0f0f0; padding: 1.5mm; margin: 2mm 0; font-weight: bold; }
        .pn-row { text-align: center; font-size: 16px; font-weight: bold; margin: 2mm 0; }
        .sn-row { text-align: center; font-size: 12px; color: #333; }
        .divider { border-top: 0.3mm dashed #999; margin: 2mm 0; }
        .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 1mm; font-size: 9px; }
        .info-item { display: flex; justify-content: space-between; padding: 1mm; border-bottom: 0.2mm dotted #ddd; }
        .info-item label { color: #666; }
        .info-item span { font-weight: 600; text-align: right; }
        @media print { body { padding: 0; } .etiqueta { border: 0.3mm solid #000; } }
      </style></head><body>
      <div class="etiqueta">
        <div class="empresa"><img src="${ctx.logoDataUri}" alt="${ctx.commercialName}"><span>${ctx.commercialName}</span></div>
        <div class="codes-row">
          <div class="qr-box">${qrBlock}</div>
          <div class="barcode-box"><svg id="barcode"></svg></div>
        </div>
        <div class="codigo">${codigo}</div>
        <div class="pn-row">${L.prefixPn}${pn}</div>
        ${sn ? `<div class="sn-row">${L.prefixSn}${sn}</div>` : ''}
        <div class="divider"></div>
        <div class="info-grid">
          <div class="info-item"><label>${L.supplier}</label><span>${escapeHtml(item.fornecedorNome || '-')}</span></div>
          <div class="info-item"><label>${L.origin}</label><span>${escapeHtml(item.fornecedorPais || '-')}</span></div>
          <div class="info-item"><label>${L.batch}</label><span>${escapeHtml(item.loteCodigo || '-')}</span></div>
          <div class="info-item"><label>${L.invoice}</label><span>${escapeHtml(item.invoiceNumero || '-')}</span></div>
          <div class="info-item"><label>${L.location}</label><span>${escapeHtml(item.localizacao || '-')}</span></div>
          <div class="info-item"><label>${L.shelf}</label><span>${shelfText(item)}</span></div>
        </div>
      </div>
      <script>
        JsBarcode("#barcode", ${pnJson}, {format: "CODE128", width: 1.5, height: 40, displayValue: true, fontSize: 10, margin: 2});
        setTimeout(() => window.print(), 700);
      <\/script></body></html>`;
}

export function buildEtiquetaMediaDocument(
  ctx: EtiquetaPrintContext,
  item: EtiquetaPrintItemInfo,
  codigoRastreio: string,
  partNumber: string,
  qrCodeUrl: string
): string {
  const L = ctx.labels;
  const codigo = escapeHtml(codigoRastreio);
  const pn = escapeHtml(partNumber);
  const sn = item.serialNumber ? escapeHtml(String(item.serialNumber)) : '';
  const qrLeft = qrCodeUrl
    ? `<img src="${qrCodeUrl}" alt="QR Code" style="width:24mm;height:24mm;display:block">`
    : qrPlaceholder(L.noQr, '24mm', '24mm', '8px').replace('#ccc', '#ddd');
  return `<!DOCTYPE html><html><head>
      <title>${L.titleMedium} - ${codigo}</title>
      <style>
        @page { size: 80mm 40mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 1mm; }
        .etiqueta { width: 78mm; height: 38mm; border: 0.5mm solid #000; padding: 2mm; background: white; display: flex; }
        .left { width: 40%; display: flex; align-items: center; justify-content: center; }
        .right { flex: 1; padding-left: 2mm; display: flex; flex-direction: column; justify-content: center; }
        .empresa { font-weight: bold; font-size: 9px; letter-spacing: 0.5px; margin-bottom: 1mm; display:flex; align-items:center; gap:1mm; }
        .empresa img { width: 3.5mm; height: 3.5mm; }
        .codigo { font-family: monospace; font-size: 8px; color: #0066cc; margin: 1mm 0; background: #f5f5f5; padding: 1mm; }
        .pn { font-size: 12px; font-weight: bold; }
        .sn { font-size: 9px; color: #333; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="etiqueta">
        <div class="left">${qrLeft}</div>
        <div class="right">
          <div class="empresa"><img src="${ctx.logoDataUri}" alt="${ctx.commercialName}"><span>${ctx.commercialName}</span></div>
          <div class="pn">${L.prefixPn}${pn}</div>
          ${sn ? `<div class="sn">${L.prefixSn}${sn}</div>` : ''}
          <div class="codigo">${codigo}</div>
        </div>
      </div>
      <script>
        setTimeout(() => window.print(), 700);
      <\/script></body></html>`;
}

export function buildEtiquetaCompactaDocument(
  ctx: EtiquetaPrintContext,
  codigoRastreio: string,
  partNumber: string,
  qrCodeUrl: string
): string {
  const L = ctx.labels;
  const codigo = escapeHtml(codigoRastreio);
  const pn = escapeHtml(partNumber);
  const qr = qrCodeUrl
    ? `<img src="${qrCodeUrl}" alt="QR Code" style="width:16mm;height:16mm;display:block;margin:0 auto">`
    : qrPlaceholder(L.noQr, '16mm', '16mm', '7px', ';margin:0 auto');
  return `<!DOCTYPE html><html><head>
      <title>${L.titleCompact} - ${codigo}</title>
      <style>
        @page { size: 60mm 40mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 1mm; }
        .etiqueta { width: 58mm; height: 38mm; border: 0.4mm solid #000; padding: 2mm; background: white; text-align: center; }
        .empresa { font-weight: bold; font-size: 8px; letter-spacing: 0.5px; border-bottom: 0.3mm solid #000; padding-bottom: 1mm; margin-bottom: 1mm; }
        .qr-container { margin: 1mm 0; }
        .pn { font-size: 11px; font-weight: bold; margin-top: 1mm; }
        .codigo { font-family: monospace; font-size: 7px; color: #666; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="etiqueta">
        <div class="empresa">${ctx.commercialName}</div>
        <div class="qr-container">${qr}</div>
        <div class="pn">${pn}</div>
        <div class="codigo">${codigo}</div>
      </div>
      <script>
        setTimeout(() => window.print(), 700);
      <\/script></body></html>`;
}

export function buildEtiquetaMinimaDocument(
  ctx: EtiquetaPrintContext,
  codigoRastreio: string,
  partNumber: string,
  qrCodeUrl: string
): string {
  const L = ctx.labels;
  const codigo = escapeHtml(codigoRastreio);
  const pn = escapeHtml(partNumber);
  const qr = qrCodeUrl
    ? `<img src="${qrCodeUrl}" alt="QR Code" style="width:14mm;height:14mm;display:block">`
    : qrPlaceholder(L.noQr, '14mm', '14mm', '6px').replace('#ccc', '#ddd');
  return `<!DOCTYPE html><html><head>
      <title>${L.titleMinimal} - ${codigo}</title>
      <style>
        @page { size: 40mm 30mm; margin: 0; }
        * { box-sizing: border-box; margin: 0; padding: 0; }
        body { font-family: Arial, sans-serif; display: flex; justify-content: center; padding: 1mm; }
        .etiqueta { width: 38mm; height: 28mm; border: 0.3mm solid #000; padding: 1mm; background: white; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; }
        .pn { font-size: 8px; font-weight: bold; margin-top: 1mm; }
        .codigo { font-family: monospace; font-size: 5px; color: #666; }
        @media print { body { padding: 0; } }
      </style></head><body>
      <div class="etiqueta">
        ${qr}
        <div class="pn">${pn}</div>
        <div class="codigo">${codigo}</div>
      </div>
      <script>
        setTimeout(() => window.print(), 700);
      <\/script></body></html>`;
}
