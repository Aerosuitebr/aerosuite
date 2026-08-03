const DEFAULT_PRIMARY = '#0ea5e9';
const DEFAULT_PRIMARY_DEEP = '#0284c7';

export function normalizeHex(hex: string | null | undefined): string {
  if (!hex?.trim()) return DEFAULT_PRIMARY;
  let h = hex.trim();
  if (!h.startsWith('#')) h = `#${h}`;
  if (h.length !== 7 && h.length !== 4) return DEFAULT_PRIMARY;
  return h.toLowerCase();
}

/** Escurece um hex #RRGGBB (factor 0–1). */
export function darkenHex(hex: string, factor: number): string {
  const n = normalizeHex(hex);
  if (n.length === 4) return DEFAULT_PRIMARY_DEEP;
  const r = parseInt(n.substring(1, 3), 16);
  const g = parseInt(n.substring(3, 5), 16);
  const b = parseInt(n.substring(5, 7), 16);
  const f = Math.max(0, Math.min(1, factor));
  const dr = Math.round(r * (1 - f));
  const dg = Math.round(g * (1 - f));
  const db = Math.round(b * (1 - f));
  return `#${dr.toString(16).padStart(2, '0')}${dg.toString(16).padStart(2, '0')}${db
    .toString(16)
    .padStart(2, '0')}`;
}

export function brandPalette(primary?: string | null): { primary: string; primaryDeep: string } {
  const p = normalizeHex(primary);
  const d = darkenHex(p, 0.22);
  return { primary: p, primaryDeep: d };
}

/** Substitui cores padrão Aero Suite em HTML inline de impressão/e-mail. */
export function applyBrandPalette(
  html: string,
  primary?: string | null,
  primaryDeep?: string | null
): string {
  if (!html) return html;
  const p = normalizeHex(primary);
  const d = normalizeHex(primaryDeep ?? darkenHex(p, 0.22));
  if (p === DEFAULT_PRIMARY && d === DEFAULT_PRIMARY_DEEP) return html;
  return html
    .replaceAll(DEFAULT_PRIMARY, p)
    .replaceAll(DEFAULT_PRIMARY.toUpperCase(), p)
    .replaceAll(DEFAULT_PRIMARY_DEEP, d)
    .replaceAll(DEFAULT_PRIMARY_DEEP.toUpperCase(), d);
}
