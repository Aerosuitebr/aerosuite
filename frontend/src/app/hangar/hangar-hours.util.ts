import type { JobCardApontamento } from '../core/job-card.service';

export interface HourRow extends JobCardApontamento { key: string; pending: boolean; userKey: string; }
export interface PendingHourEntry extends Omit<JobCardApontamento, 'id'> { id: string; }
export interface HourFilters { day: string; user: string; group: 'none' | 'day' | 'user'; }
export interface HourGroup { key: string; label: string; rows: HourRow[]; registered: number; pending: number; }
export const UNKNOWN_USER = '__unknown__';
export const PENDING_USER = '__pending__';

export function hourRows(records: JobCardApontamento[], pending: PendingHourEntry[]): HourRow[] {
  return [
    ...records.map(record => ({ ...record, key: `server-${record.id}`, pending: false, userKey: record.usuarioNome?.trim() || UNKNOWN_USER })),
    ...pending.map(record => ({ ...record, id: 0, key: `pending-${record.id}`, pending: true, userKey: PENDING_USER }))
  ];
}
export function sumHours(rows: HourRow[], pending: boolean): number {
  return rows.filter(row => row.pending === pending).reduce((total, row) => total + (Number.isFinite(Number(row.horas)) ? Math.round(Number(row.horas) * 100) : 0), 0) / 100;
}
export function filterHours(rows: HourRow[], filters: HourFilters): HourRow[] {
  return rows.filter(row => (!filters.day || row.trabalhoEm === filters.day) && (!filters.user || row.userKey === filters.user))
    .sort((a,b) => b.trabalhoEm.localeCompare(a.trabalhoEm) || Number(a.pending) - Number(b.pending) || a.key.localeCompare(b.key, undefined, {numeric:true}));
}
export function groupHours(rows: HourRow[], filters: HourFilters, language: string, userLabel: (key:string) => string): HourGroup[] {
  const groups = new Map<string, HourRow[]>();
  for (const row of filterHours(rows, filters)) {
    const key = filters.group === 'day' ? row.trabalhoEm : filters.group === 'user' ? row.userKey : 'all';
    groups.set(key, [...(groups.get(key) || []), row]);
  }
  const collator = new Intl.Collator(language, {sensitivity:'base', numeric:true});
  return Array.from(groups, ([key, items]) => ({ key, label: filters.group === 'user' ? userLabel(key) : key,
    rows: items, registered: sumHours(items, false), pending: sumHours(items, true) }))
    .sort((a,b) => filters.group === 'day' ? b.key.localeCompare(a.key) : collator.compare(a.label,b.label));
}
