import { ItemEstoque } from '../../core/estoque.service';

/** Prefixo do QR de item (igual {@link ItemEstoque#QR_PAYLOAD_PREFIX} no backend). */
export const ETIQUETA_QR_PREFIX = 'AERO:I:';

/** Dados mínimos para montar payload do QR. */
export type EtiquetaQrSource = Pick<
  ItemEstoque,
  'id' | 'qrCodeData' | 'codigoRastreio' | 'partNumber' | 'serialNumber'
>;

/** {@code localhost}, {@code 127.0.0.1} — inacessível no celular; precisa IP da LAN ou URL pública. */
export function isLoopbackScanOrigin(origin: string): boolean {
  const o = (origin ?? '').trim();
  if (!o) {
    return false;
  }
  try {
    const u = new URL(o.startsWith('http') ? o : `http://${o}`);
    const h = u.hostname.toLowerCase();
    return h === 'localhost' || h === '127.0.0.1' || h === '0.0.0.0' || h === '[::1]';
  } catch {
    return o.includes('localhost') || o.includes('127.0.0.1');
  }
}

/**
 * URL pública aberta ao escanear o QR no celular (ficha resumida do produto).
 */
export function buildEtiquetaQrScanUrl(
  item: EtiquetaQrSource,
  tenantCodigo?: string,
  origin?: string
): string {
  const cod = (item.codigoRastreio ?? '').trim();
  const tenant = (tenantCodigo ?? '').trim().toLowerCase();
  const base = (origin ?? '').replace(/\/$/, '');
  if (!cod || !tenant || !base) {
    return '';
  }
  return `${base}/rastreio/${encodeURIComponent(cod)}?tenant=${encodeURIComponent(tenant)}`;
}

/**
 * Payload do QR para impressão térmica/PPLB e validação.
 * Prioriza URL acessível no celular; fallback para código de rastreio ou {@code AERO:I:id}.
 *
 * @param scanOrigin Use {@link EstoqueQrOriginService.resolveOrigin} quando em localhost.
 */
export function resolveEtiquetaQrPayload(
  item: EtiquetaQrSource,
  tenantCodigo?: string,
  scanOrigin?: string
): string {
  const origin =
    scanOrigin?.trim() ||
    (typeof globalThis !== 'undefined' &&
    'location' in globalThis &&
    (globalThis as { location?: { origin?: string } }).location?.origin
      ? (globalThis as { location: { origin: string } }).location.origin
      : '');

  const url = buildEtiquetaQrScanUrl(item, tenantCodigo, origin);
  if (url.startsWith('http') && !isLoopbackScanOrigin(url)) {
    return url;
  }

  const stored = (item.qrCodeData ?? '').trim();
  if (stored.startsWith('http') && !isLoopbackScanOrigin(stored)) {
    return stored;
  }

  const cod = (item.codigoRastreio ?? '').trim();
  if (cod) {
    return cod;
  }
  if (stored && !stored.startsWith('{')) {
    return stored;
  }
  if (stored.startsWith('{')) {
    const idFromJson = extractIdFromLegacyJson(stored);
    if (idFromJson != null) {
      return `${ETIQUETA_QR_PREFIX}${idFromJson}`;
    }
  }
  if (item.id != null) {
    return `${ETIQUETA_QR_PREFIX}${item.id}`;
  }
  return '';
}

function extractIdFromLegacyJson(json: string): number | null {
  const m = /"id"\s*:\s*(\d+)/.exec(json);
  if (!m) {
    return null;
  }
  const n = Number(m[1]);
  return Number.isFinite(n) ? n : null;
}

/** Extrai código de rastreio (e tenant) de URL pública `/rastreio/{cod}?tenant=`. */
export function parsePublicRastreioFromScan(raw: string): { codigo: string; tenant?: string } | null {
  const t = (raw ?? '').trim();
  if (!t) {
    return null;
  }
  try {
    if (/^https?:\/\//i.test(t)) {
      const url = new URL(t);
      const m = url.pathname.match(/\/rastreio\/([^/?#]+)/i);
      if (m) {
        return {
          codigo: decodeURIComponent(m[1]),
          tenant: url.searchParams.get('tenant') ?? undefined
        };
      }
    }
  } catch {
    // ignore
  }
  const pathMatch = t.match(/\/rastreio\/([^/?#&\s]+)/i);
  if (pathMatch) {
    const codigo = decodeURIComponent(pathMatch[1]);
    const tenantM = /[?&]tenant=([^&]+)/i.exec(t);
    return {
      codigo,
      tenant: tenantM ? decodeURIComponent(tenantM[1]) : undefined
    };
  }
  return null;
}

/**
 * Normaliza leitura do scanner/câmera antes da consulta API.
 */
export function normalizeEstoqueScanInput(raw: string): string {
  const t = (raw ?? '').trim();
  if (!t) {
    return t;
  }

  const fromUrl = parsePublicRastreioFromScan(t);
  if (fromUrl?.codigo) {
    return fromUrl.codigo.trim();
  }

  const upper = t.toUpperCase();
  const prefix = ETIQUETA_QR_PREFIX.toUpperCase();
  if (upper.startsWith(prefix)) {
    const id = t.slice(ETIQUETA_QR_PREFIX.length).trim().replace(/\D.*$/, '');
    return id ? `${ETIQUETA_QR_PREFIX}${id}` : t;
  }
  const idx = upper.indexOf(prefix);
  if (idx >= 0) {
    const id = t.slice(idx + ETIQUETA_QR_PREFIX.length).trim().replace(/\D.*$/, '');
    return id ? `${ETIQUETA_QR_PREFIX}${id}` : t;
  }
  return t;
}
