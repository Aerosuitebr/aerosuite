import { describe, expect, it } from 'vitest';
import { hourRows, filterHours, groupHours, sumHours, UNKNOWN_USER, PENDING_USER, type HourFilters } from './hangar-hours.util';
import type { JobCardApontamento } from '../core/job-card.service';

const records: JobCardApontamento[] = [
  { id:1, trabalhoEm:'2026-10-26', horas:8, usuarioNome:'Ana', descricao:'Inspeção', ferramentaIdentificador:'TOOL-1' },
  { id:2, trabalhoEm:'2026-10-27', horas:8, usuarioNome:'Bruno' },
  { id:3, trabalhoEm:'2026-10-27', horas:2.25, usuarioNome:'Ana' }
];
const filters: HourFilters = { day:'', user:'', group:'none' };
const label = (key:string) => key;

describe('Hangar hours history', () => {
  it('retains recorded details and keeps queued hours out of the registered total', () => {
    const rows=hourRows(records,[{ id:'local-1', trabalhoEm:'2026-10-27', horas:1.5, ferramentaIdentificador:'OFF-1' }]);
    expect(sumHours(rows,false)).toBe(18.25); expect(sumHours(rows,true)).toBe(1.5);
    expect(rows[0].ferramentaIdentificador).toBe('TOOL-1'); expect(rows[3].userKey).toBe(PENDING_USER);
    expect(new Set(rows.map(row=>row.key)).size).toBe(4);
  });
  it('combines day and contributor filters', () => {
    const rows=filterHours(hourRows(records,[]),{...filters,day:'2026-10-27',user:'Ana'});
    expect(rows.map(row=>row.id)).toEqual([3]); expect(sumHours(rows,false)).toBe(2.25);
  });
  it('groups by day, newest first, with accurate subtotals', () => {
    const groups=groupHours(hourRows(records,[]),{...filters,group:'day'},'pt-BR',label);
    expect(groups.map(group=>group.key)).toEqual(['2026-10-27','2026-10-26']);
    expect(groups.map(group=>group.registered)).toEqual([10.25,8]);
  });
  it('groups contributors alphabetically without inferring activities from text', () => {
    const groups=groupHours(hourRows(records,[]),{...filters,group:'user'},'pt-BR',label);
    expect(groups.map(group=>[group.label,group.registered])).toEqual([['Ana',10.25],['Bruno',8]]);
  });
  it('keeps pending hours separate inside a group', () => {
    const groups=groupHours(hourRows(records,[{id:'pending',trabalhoEm:'2026-10-27',horas:.5}]),{...filters,group:'day'},'pt-BR',label);
    expect(groups[0].registered).toBe(10.25); expect(groups[0].pending).toBe(.5);
  });
  it('avoids floating-point artifacts in decimal hour totals', () => {
    const rows=hourRows([{id:1,trabalhoEm:'2026-10-27',horas:.1},{id:2,trabalhoEm:'2026-10-27',horas:.2}],[]);
    expect(sumHours(rows,false)).toBe(.3);
  });
  it('handles missing contributors and empty filtered results', () => {
    const rows=hourRows([{id:1,trabalhoEm:'2026-10-27',horas:1}],[]);
    expect(rows[0].userKey).toBe(UNKNOWN_USER);
    expect(groupHours(rows,{...filters,day:'2026-01-01'},'pt-BR',label)).toEqual([]);
  });
  it('does not reorder or mutate source records when grouping', () => {
    const before=JSON.stringify(records);
    groupHours(hourRows(records,[]),{...filters,group:'day'},'pt-BR',label);
    expect(JSON.stringify(records)).toBe(before);
  });
});
