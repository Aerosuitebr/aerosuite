/** Brazilian input formatting and lightweight validation (CNPJ, CEP, phone). */

export function digitsOnly(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '');
}

export function formatCep(value: string): string {
  const d = digitsOnly(value).slice(0, 8);
  if (d.length <= 5) {
    return d;
  }
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function formatCnpj(value: string): string {
  const d = digitsOnly(value).slice(0, 14);
  if (d.length <= 2) {
    return d;
  }
  if (d.length <= 5) {
    return `${d.slice(0, 2)}.${d.slice(2)}`;
  }
  if (d.length <= 8) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5)}`;
  }
  if (d.length <= 12) {
    return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8)}`;
  }
  return `${d.slice(0, 2)}.${d.slice(2, 5)}.${d.slice(5, 8)}/${d.slice(8, 12)}-${d.slice(12)}`;
}

/** Formats national BR numbers; preserves leading + for international input. */
export function formatPhoneBr(value: string): string {
  const raw = (value ?? '').trim();
  if (raw.startsWith('+')) {
    const digits = digitsOnly(raw.slice(1));
    return digits ? `+${digits}` : '+';
  }
  const d = digitsOnly(value).slice(0, 11);
  if (d.length === 0) {
    return '';
  }
  if (d.length <= 2) {
    return `(${d}`;
  }
  if (d.length <= 6) {
    return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  }
  if (d.length <= 10) {
    return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  }
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/** Exibe telefone com máscara BR; vazio permanece vazio. */
export function displayPhoneBr(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) {
    return '';
  }
  return formatPhoneBr(raw);
}

/** Href `tel:` com apenas dígitos (e `+` internacional quando aplicável). */
export function phoneTelHref(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) {
    return '';
  }
  if (raw.startsWith('+')) {
    const digits = digitsOnly(raw);
    return digits ? `tel:+${digits}` : '';
  }
  const digits = digitsOnly(raw);
  return digits ? `tel:${digits}` : '';
}

export function isValidCnpjLength(value: string): boolean {
  return digitsOnly(value).length === 14;
}

export function isValidCepLength(value: string): boolean {
  return digitsOnly(value).length === 8;
}

export function isValidPhoneBr(value: string): boolean {
  const raw = (value ?? '').trim();
  if (raw.startsWith('+')) {
    return digitsOnly(raw).length >= 10;
  }
  const d = digitsOnly(value);
  return d.length >= 10 && d.length <= 11;
}

/** Modulo-11 CNPJ check (Receita Federal algorithm). */
export function isValidCnpjChecksum(value: string): boolean {
  const d = digitsOnly(value);
  if (d.length !== 14 || /^(\d)\1+$/.test(d)) {
    return false;
  }
  const calc = (base: string, weights: number[]): number => {
    let sum = 0;
    for (let i = 0; i < weights.length; i++) {
      sum += Number(base[i]) * weights[i];
    }
    const mod = sum % 11;
    return mod < 2 ? 0 : 11 - mod;
  };
  const w1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const w2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
  const d1 = calc(d.slice(0, 12), w1);
  const d2 = calc(d.slice(0, 12) + String(d1), w2);
  return d.endsWith(`${d1}${d2}`);
}

const EMAIL_LOCAL_RE = /^[a-z0-9._%+-]+$/i;
const EMAIL_DOMAIN_RE = /^[a-z0-9.-]+\.[a-z]{2,}$/i;

/** Rejects invalid domains (.local, missing TLD, etc.) for business contact fields. */
export function isValidBusinessEmail(value: string): boolean {
  const raw = (value ?? '').trim();
  if (!raw.includes('@')) {
    return false;
  }
  const [local, domain] = raw.split('@');
  if (!local || !domain || domain.includes('..')) {
    return false;
  }
  if (!EMAIL_LOCAL_RE.test(local) || !EMAIL_DOMAIN_RE.test(domain)) {
    return false;
  }
  if (domain.endsWith('.local') || domain.endsWith('.invalid') || domain.endsWith('.test')) {
    return false;
  }
  return true;
}

export function isValidHttpUrl(value: string): boolean {
  const raw = (value ?? '').trim();
  if (!raw) {
    return true;
  }
  try {
    const u = new URL(raw.startsWith('http') ? raw : `https://${raw}`);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
}

/** L x A x P — three positive numbers separated by x (case insensitive). */
export function isValidDimensions(value: string): boolean {
  const raw = (value ?? '').trim();
  if (!raw) {
    return true;
  }
  const parts = raw.split(/x/i).map((p) => p.trim());
  if (parts.length !== 3) {
    return false;
  }
  return parts.every((p) => /^\d+([.,]\d+)?$/.test(p) && Number(p.replace(',', '.')) > 0);
}

/** Remove trailing CPF (11 digits) often appended to razão social from Receita Federal lookup. */
export function maskCpfInRazaoSocial(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) {
    return '';
  }
  return raw.replace(/\s+\d{11}\s*$/, '').trim();
}

/** Title-case for address fields returned in ALL CAPS from public APIs. */
export function formatBrTitleCase(value: string | null | undefined): string {
  const raw = (value ?? '').trim();
  if (!raw) {
    return '';
  }
  return raw
    .toLocaleLowerCase('pt-BR')
    .replace(/(^|[\s\-/])(\p{L})/gu, (_, sep: string, ch: string) => sep + ch.toLocaleUpperCase('pt-BR'));
}

/** Remove separadores residuais de lookup CEP/CNPJ (ex.: " ·" no bairro). */
export function sanitizeAddressField(value: string | null | undefined): string {
  return (value ?? '')
    .trim()
    .replace(/^[\s·•\-–—/]+|[\s·•\-–—/]+$/g, '')
    .replace(/\s{2,}/g, ' ');
}

/** Part Number MRO: alfanumérico com hífen/ponto, sem espaços. */
export const PRODUCT_PN_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._-]*$/;

export function isValidProductPn(value: string | null | undefined): boolean {
  const raw = (value ?? '').trim();
  if (!raw) {
    return false;
  }
  return PRODUCT_PN_PATTERN.test(raw);
}

export function normalizeProductPnInput(value: string): string {
  return (value ?? '').replace(/\s+/g, '').slice(0, 64);
}

/** Verifica PN duplicado na lista local (case-insensitive), ignorando o produto em edição. */
export function isDuplicateProductPn(
  pn: string | null | undefined,
  existing: ReadonlyArray<{ id?: number; productpn?: string | null }>,
  excludeId?: number | null
): boolean {
  const normalized = (pn ?? '').trim().toLowerCase();
  if (!normalized) {
    return false;
  }
  return existing.some((row) => {
    if (!row.productpn?.trim()) {
      return false;
    }
    if (excludeId != null && row.id === excludeId) {
      return false;
    }
    return row.productpn.trim().toLowerCase() === normalized;
  });
}

/** Normalize date search: DD/MM/YYYY, DD.MM.YYYY or DDMMYYYY. */
export function normalizeDateSearchTerm(value: string): string | null {
  const t = (value ?? '').trim();
  if (!t) {
    return null;
  }
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(t) || /^\d{4}-\d{2}-\d{2}$/.test(t)) {
    return t;
  }
  if (/^\d{2}\.\d{2}\.\d{4}$/.test(t)) {
    const [d, m, y] = t.split('.');
    return `${d}/${m}/${y}`;
  }
  if (/^\d{8}$/.test(t)) {
    return `${t.slice(0, 2)}/${t.slice(2, 4)}/${t.slice(4)}`;
  }
  return null;
}
