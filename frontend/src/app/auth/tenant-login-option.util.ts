import type { TenantLoginOption } from './auth.service';

/** Rótulo único para dropdown de organização (A2 — mesmo nome, códigos/datas diferentes). */
export function enrichTenantLoginOptions<T extends TenantLoginOption>(
  options: T[],
  formatLabel: (o: T) => string,
): T[] {
  return (options ?? []).map(o => ({
    ...o,
    label: formatLabel(o),
  }));
}

export function defaultTenantOptionLabelParts(o: TenantLoginOption): {
  nome: string;
  codigo: string;
  criadoEm: string;
  id: string;
} {
  return {
    nome: (o.nome || o.codigo || '').trim(),
    codigo: (o.codigo || '').trim(),
    criadoEm: (o.criadoEm || '').trim(),
    id: o.id != null ? String(o.id) : '',
  };
}
