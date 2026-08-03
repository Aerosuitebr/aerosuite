/**
 * Gera comandos PPLB para Elgin L42 (203 dpi, 8 dpmm).
 * Etiqueta 100×60 mm → 800×480 dots; gap padrão 24 dots.
 *
 * QR: comando `b` em coords nativas (sem espelhar como A/B em flip180).
 * Texto: layoutPoint + rotação 2 (flip180).
 */
export const PPLB_LABEL_WIDTH_DOTS = 800;
export const PPLB_LABEL_HEIGHT_DOTS = 480;
export const PPLB_LABEL_GAP_DOTS = 24;
/** 203 dpi / 8 dpmm — conversão mm → dots. */
const PPLB_DPMM = 8;

export type PplbLabelOrientation = 'normal' | 'zb' | 'flip180';

export const PPLB_LABEL_ORIENTATION: PplbLabelOrientation = 'flip180';

/** Margem esquerda ~8 mm (coords de desenho para texto A/B). */
const PPLB_MARGIN_LEFT_DESIGN = 64;
const PPLB_HEADER_CENTER_X = 400;
const PPLB_HEADER_Y = 18;
/** Só o título (Aero Suite): +mm em coords de desenho = desce na etiqueta (flip180). */
const PPLB_HEADER_SHIFT_DOWN_MM = 2;

/** Início do bloco de dados (abaixo do cabeçalho). */
const PPLB_BODY_START_Y = 80;
/** Espaço após a 1ª linha (fonte maior → P/N). */
const PPLB_BODY_STEP_AFTER_FIRST = 64;
/** 2ª linha em diante (P/N, extra, etc.). */
const PPLB_BODY_STEP_AFTER_OTHER = 72;
const PPLB_BODY_LINE_MAX_CHARS = 24;
/** 1ª linha (código de rastreio) — coluna esquerda quando há QR à direita. */
const PPLB_BODY_LINE_MAX_CHARS_WITH_QR = 14;
const PPLB_BODY_MAX_LINES = 4;

const PPLB_QR_MAG = 4;
/** Lado aproximado do QR em dots (Elgin `s` × ~25). */
const PPLB_QR_SIDE_DOTS = 25 * PPLB_QR_MAG;
/** Folga entre a base do QR e o topo do Code128. */
const PPLB_QR_GAP_ABOVE_BARCODE_MM = 1.5;
/** Ajuste fino em relação ao alinhamento Code128 (L42: menos X = direita; menos Y = baixo). */
const PPLB_QR_SHIFT_RIGHT_MM = 5;
const PPLB_QR_SHIFT_DOWN_MM = 14;

const PPLB_BARCODE_MARGIN_X = 56;
const PPLB_BARCODE_Y = 360;
const PPLB_BARCODE_HEIGHT = 56;

export interface PplbEtiquetaPadrao100x60Params {
  headerLine: string;
  bodyLines: string[];
  barcodeValue: string;
  qrPayload?: string | null;
}

function asciiForPplb(value: string): string {
  return (value ?? '')
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .replace(/[^\x20-\x7E]/g, '');
}

export function escapePplbText(value: string): string {
  return asciiForPplb(value).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function truncateLine(text: string, maxLen: number): string {
  const t = (text ?? '').trim();
  if (t.length <= maxLen) return t;
  return t.slice(0, maxLen - 1) + '…';
}

function prepareBodyLines(lines: string[], hasQr: boolean): string[] {
  return (lines ?? [])
    .map((l, i) =>
      truncateLine(
        l,
        i === 0 && hasQr ? PPLB_BODY_LINE_MAX_CHARS_WITH_QR : PPLB_BODY_LINE_MAX_CHARS
      )
    )
    .filter((l) => l.length > 0)
    .slice(0, PPLB_BODY_MAX_LINES);
}

const PPLB_ROT_180 = 2;

function layoutPoint(x: number, y: number): { x: number; y: number; rot: number } {
  if (PPLB_LABEL_ORIENTATION === 'flip180') {
    return {
      x: PPLB_LABEL_WIDTH_DOTS - x,
      y: PPLB_LABEL_HEIGHT_DOTS - y,
      rot: PPLB_ROT_180
    };
  }
  return { x, y, rot: 0 };
}

function estimateCode128WidthDots(data: string): number {
  const modules = 35 + data.length * 11;
  return modules * 2;
}

function barcodePoint(data: string): { x: number; y: number; rot: number } {
  if (PPLB_LABEL_ORIENTATION === 'flip180') {
    const w = estimateCode128WidthDots(data);
    const maxAnchor = PPLB_LABEL_WIDTH_DOTS - PPLB_BARCODE_MARGIN_X;
    const anchorX = Math.min(maxAnchor, PPLB_BARCODE_MARGIN_X + w);
    return {
      x: anchorX,
      y: PPLB_LABEL_HEIGHT_DOTS - PPLB_BARCODE_Y,
      rot: PPLB_ROT_180
    };
  }
  return { x: PPLB_BARCODE_MARGIN_X, y: PPLB_BARCODE_Y, rot: 0 };
}

/**
 * Fim do Code128 na margem direita (coords nativas do `B` com rot 2 na L42).
 * O anchor `barcodePoint().x` é o lado interno (56+largura); a borda direita fica em {@link PPLB_BARCODE_MARGIN_X}.
 */
function barcodeRightEdgeNativeX(_barcodeData: string): number {
  return PPLB_BARCODE_MARGIN_X;
}

/**
 * QR acima do Code128, alinhado pela direita ao fim do código de barras.
 * Comando `b`: origem no canto sup.-esq. do módulo; na L42 X↓ = direita, Y↓ = baixo.
 */
function qrNativePosition(_barcodeData: string): { x: number; y: number } {
  const qrSide = PPLB_QR_SIDE_DOTS;
  const barRight = barcodeRightEdgeNativeX(_barcodeData);
  const shiftRight = PPLB_QR_SHIFT_RIGHT_MM * PPLB_DPMM;
  const shiftDown = PPLB_QR_SHIFT_DOWN_MM * PPLB_DPMM;

  const x = barRight + qrSide - shiftRight;

  const barcodeAnchorY = PPLB_LABEL_HEIGHT_DOTS - PPLB_BARCODE_Y;
  const barcodeTopNativeY = barcodeAnchorY + PPLB_BARCODE_HEIGHT;
  const gapDots = PPLB_QR_GAP_ABOVE_BARCODE_MM * PPLB_DPMM;
  const y = barcodeTopNativeY + gapDots + qrSide - shiftDown;

  return {
    x: Math.max(8, Math.min(PPLB_LABEL_WIDTH_DOTS - qrSide - 8, x)),
    y: Math.max(8, Math.min(PPLB_LABEL_HEIGHT_DOTS - qrSide - 8, y))
  };
}

/** Payload do QR para PPLB — mantém prefixo AERO:I: intacto (só escapa aspas). */
function qrPayloadForPplb(payload: string): string {
  return asciiForPplb(payload).replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

function buildQrPplbCommand(payload: string, barcodeValue: string): string | null {
  const data = qrPayloadForPplb(payload);
  const barcode = (barcodeValue ?? '').trim();
  if (!data || !barcode) {
    return null;
  }
  const pos = qrNativePosition(barcode);
  const mag = Math.max(3, Math.min(8, PPLB_QR_MAG));
  return `b${pos.x},${pos.y},Q,m2,s${mag},eM,iA,"${data}"`;
}

/**
 * Layout 100×60: cabeçalho centralizado, texto à esquerda (fonte 5/4), QR sup.-dir., Code128 embaixo.
 */
export function buildPplbEtiquetaPadrao100x60(p: PplbEtiquetaPadrao100x60Params): string {
  const qr = (p.qrPayload ?? '').trim();
  const lines = prepareBodyLines(p.bodyLines ?? [], !!qr);
  const header = truncateLine(p.headerLine, 28);
  const barcode = truncateLine(p.barcodeValue || '', 48);

  const parts: string[] = ['N'];
  if (PPLB_LABEL_ORIENTATION === 'zb') {
    parts.push('ZB');
  }
  parts.push(`q${PPLB_LABEL_WIDTH_DOTS}`, `Q${PPLB_LABEL_HEIGHT_DOTS},${PPLB_LABEL_GAP_DOTS}`);

  if (header) {
    const headerY = PPLB_HEADER_Y + PPLB_HEADER_SHIFT_DOWN_MM * PPLB_DPMM;
    const c = layoutPoint(PPLB_HEADER_CENTER_X, headerY);
    parts.push(`A${c.x},${c.y},${c.rot},3,1,1,N,"${escapePplbText(header)}"`);
  }

  let y = PPLB_BODY_START_Y;
  for (let i = 0; i < lines.length; i++) {
    const font = i === 0 ? 5 : 4;
    const c = layoutPoint(PPLB_MARGIN_LEFT_DESIGN, y);
    parts.push(`A${c.x},${c.y},${c.rot},${font},1,1,N,"${escapePplbText(lines[i])}"`);
    if (i < lines.length - 1) {
      y += i === 0 ? PPLB_BODY_STEP_AFTER_FIRST : PPLB_BODY_STEP_AFTER_OTHER;
    }
  }

  const qrCmd = qr && barcode ? buildQrPplbCommand(qr, barcode) : null;
  if (qrCmd) {
    parts.push(qrCmd);
  }

  if (barcode) {
    const c = barcodePoint(barcode);
    parts.push(`B${c.x},${c.y},${c.rot},1,2,4,${PPLB_BARCODE_HEIGHT},N,"${escapePplbText(barcode)}"`);
  }

  parts.push('P1');
  return parts.join('\n') + '\n';
}
