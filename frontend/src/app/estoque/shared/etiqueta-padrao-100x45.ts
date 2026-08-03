/**
 * Etiqueta padrão para impressão: 100 mm (largura) × 60 mm (altura).
 * Usa @page e caixa em mm para o driver (ex.: Elgin L42 Pro Full) respeitar o tamanho físico.
 */
export function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export const ETIQUETA_PADRAO_WIDTH_MM = 100;
export const ETIQUETA_PADRAO_HEIGHT_MM = 60;

export interface EtiquetaPadrao100x45Params {
  appLogoDataUri: string;
  commercialName: string;
  codigoRastreio: string;
  partNumber: string;
  qrCodeDataUrl: string;
  serialNumber?: string | null;
  /** Texto extra opcional (ex.: localização), linha pequena abaixo do P/N */
  linhaExtra?: string | null;
  prefixPn?: string;
  prefixSn?: string;
  noQr?: string;
  titleStandard?: string;
}

export function buildEtiquetaPadrao100x60Document(p: EtiquetaPadrao100x45Params): string {
  const w = ETIQUETA_PADRAO_WIDTH_MM;
  const h = ETIQUETA_PADRAO_HEIGHT_MM;
  const codigo = escapeHtml(p.codigoRastreio || '');
  const pn = escapeHtml(p.partNumber || '');
  const sn = p.serialNumber ? escapeHtml(String(p.serialNumber)) : '';
  const extra = p.linhaExtra ? escapeHtml(String(p.linhaExtra)) : '';
  const commercialName = escapeHtml(p.commercialName || 'Aero Suite');
  const prefixPnLbl = escapeHtml(p.prefixPn ?? 'P/N: ');
  const prefixSnLbl = escapeHtml(p.prefixSn ?? 'S/N: ');
  const noQr = escapeHtml(p.noQr ?? 'Sem QR');
  const title = escapeHtml(p.titleStandard ?? 'Etiqueta');
  const qrBlock = p.qrCodeDataUrl
    ? `<img src="${p.qrCodeDataUrl}" alt="QR" class="qr-img">`
    : `<div class="qr-falta">${noQr}</div>`;
  const pnJson = JSON.stringify(p.partNumber || '');

  return `<!DOCTYPE html><html><head>
<meta charset="utf-8">
<title>${title} - ${codigo}</title>
<script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.6/dist/JsBarcode.all.min.js"><\/script>
<style>
  @page { size: ${w}mm ${h}mm; margin: 0; }
  * { box-sizing: border-box; margin: 0; padding: 0; }
  html, body {
    width: ${w}mm;
    height: ${h}mm;
    overflow: hidden;
    margin: 0;
    padding: 0;
  }
  body {
    font-family: Arial, Helvetica, sans-serif;
    -webkit-print-color-adjust: exact;
    print-color-adjust: exact;
    background: #fff;
  }
  .etiqueta {
    width: ${w}mm;
    height: ${h}mm;
    max-height: ${h}mm;
    border: 0.35mm solid #000;
    padding: 2mm 3.5mm 2mm 4mm;
    background: #fff;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    page-break-after: avoid;
    page-break-inside: avoid;
  }
  .header {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 1.2mm;
    flex-shrink: 0;
    width: 100%;
  }
  .header img {
    width: 5mm;
    height: 5mm;
    border-radius: 50%;
    object-fit: contain;
  }
  .header span {
    font-weight: bold;
    font-size: 8pt;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }
  .header-line {
    height: 0.55mm;
    background: #000;
    margin: 0.9mm 0 1.2mm;
    flex-shrink: 0;
  }
  .main-row {
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 2.5mm;
    margin-top: 0.5mm;
  }
  .text-col {
    flex: 1;
    min-width: 0;
    display: flex;
    flex-direction: column;
    justify-content: flex-start;
    gap: 0.35mm;
    padding-right: 1mm;
  }
  .qr-wrap {
    flex-shrink: 0;
    width: 20mm;
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
  }
  .qr-img {
    width: 19mm;
    height: 19mm;
    display: block;
    border: 0.2mm solid #ccc;
  }
  .qr-falta {
    width: 19mm;
    height: 19mm;
    border: 0.25mm dashed #bbb;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 5pt;
    color: #888;
  }
  .bar-wrap {
    flex-shrink: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    width: 100%;
    margin-top: 0.6mm;
  }
  .barcode-img {
    display: block;
    max-width: 100%;
    width: auto;
    height: 20mm;
    object-fit: contain;
    object-position: center;
    image-rendering: crisp-edges;
    image-rendering: pixelated;
  }
  .codigo {
    text-align: left;
    font-family: Consolas, "Courier New", monospace;
    font-size: 9.5pt;
    font-weight: 700;
    color: #000;
    line-height: 1.1;
    word-break: break-all;
  }
  .pn {
    text-align: left;
    font-size: 10pt;
    font-weight: bold;
    line-height: 1.1;
    word-break: break-all;
  }
  .sn, .extra {
    text-align: left;
    font-size: 8pt;
    color: #222;
    line-height: 1.15;
    word-break: break-all;
  }
  @media print {
    html, body {
      width: ${w}mm;
      height: ${h}mm;
      overflow: hidden;
    }
    body { padding: 0; }
    .etiqueta { border: 0.35mm solid #000; }
  }
</style></head><body>
<div class="etiqueta">
  <div class="header">
    <img src="${p.appLogoDataUri}" alt="">
    <span>${commercialName}</span>
  </div>
  <div class="header-line"></div>
  <div class="main-row">
    <div class="text-col">
      <div class="codigo">${codigo}</div>
      <div class="pn">${prefixPnLbl} ${pn}</div>
      ${sn ? `<div class="sn">${prefixSnLbl} ${sn}</div>` : ''}
      ${extra ? `<div class="extra">${extra}</div>` : ''}
    </div>
    <div class="qr-wrap">${qrBlock}</div>
  </div>
  <div class="bar-wrap"><img id="barcode-img" class="barcode-img" alt=""></div>
</div>
<script>
  (function () {
    var pn = ${pnJson};
    var img = document.getElementById('barcode-img');
    function doPrint() {
      setTimeout(function () { window.print(); }, 150);
    }
    if (!pn || !img) {
      doPrint();
      return;
    }
    try {
      var canvas = document.createElement('canvas');
      JsBarcode(canvas, pn, {
        format: 'CODE128',
        width: 2,
        height: 48,
        displayValue: true,
        fontSize: 13,
        textMargin: 2,
        margin: 4
      });
      img.onload = doPrint;
      img.onerror = doPrint;
      img.src = canvas.toDataURL('image/png');
    } catch (e) {
      console.error(e);
      doPrint();
    }
  })();
<\/script>
</body></html>`;
}

/** @deprecated Prefer buildEtiquetaPadrao100x60Document — alias para compatibilidade. */
export const buildEtiquetaPadrao100x45Document = buildEtiquetaPadrao100x60Document;
