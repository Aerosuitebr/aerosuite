/** ISO date-only (YYYY-MM-DD) without timezone shifts. */

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})/;

export function parseIsoDateLocal(value?: string | Date | null): Date | null {
  if (value == null || value === '') return null;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? null : new Date(value.getFullYear(), value.getMonth(), value.getDate());
  }
  const m = ISO_DATE_RE.exec(String(value).trim());
  if (!m) return null;
  const d = new Date(+m[1], +m[2] - 1, +m[3]);
  return isNaN(d.getTime()) ? null : d;
}

export function formatIsoDateLocal(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

/** dd/MM/yyyy for API date-only strings. */
export function formatIsoDateDisplay(value?: string | Date | null): string {
  const d = parseIsoDateLocal(value);
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

export function toIsoDatePayload(value?: string | Date | null): string | undefined {
  if (value == null || value === '') return undefined;
  if (value instanceof Date) {
    return isNaN(value.getTime()) ? undefined : formatIsoDateLocal(value);
  }
  const m = ISO_DATE_RE.exec(String(value).trim());
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}
