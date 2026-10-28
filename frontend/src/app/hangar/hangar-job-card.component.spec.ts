import '@angular/compiler';
import { describe, it, expect, vi } from 'vitest';
import { Subject } from 'rxjs';
import { HangarJobCardComponent } from './hangar-job-card.component';
import type { JobCard, JobCardListItem } from '../core/job-card.service';

const todo = { osId: 1, numeroOs: 20, faseJob: 'A_FAZER', destinosPermitidos: ['EM_ANDAMENTO'] } as JobCardListItem;
function setup(online = true) {
  const response = new Subject<JobCard>();
  const component = Object.assign(Object.create(HangarJobCardComponent.prototype), {
    itens: [todo], movingId: null, loadingLista: false, expandedEmptyColumns: new Set(), suppressClickUntil: 0,
    offlineCache: { isOnline: () => online }, jobCard: { moverFase: vi.fn(() => response) },
    toast: { add: vi.fn() }, i18n: { translate: (key:string) => key }, carregarLista: vi.fn(), router: { navigate: vi.fn() }
  }) as any;
  return { component, response };
}
describe('Hangar board', () => {
  it('allows only server-authorized destinations and blocks offline moves', () => {
    const { component } = setup();
    expect(component.canMove(todo, 'EM_ANDAMENTO')).toBe(true);
    expect(component.canMove(todo, 'CONCLUIDO')).toBe(false);
    expect(setup(false).component.canDrag(todo)).toBe(false);
  });
  it('waits for the server and prevents duplicate moves', () => {
    const { component, response } = setup();
    component.moveCard(todo, 'EM_ANDAMENTO'); component.moveCard(todo, 'EM_ANDAMENTO');
    expect(component.jobCard.moverFase).toHaveBeenCalledTimes(1);
    expect(todo.faseJob).toBe('A_FAZER');
    response.next({} as JobCard);
    expect(component.carregarLista).toHaveBeenCalledOnce();
    expect(component.movingId).toBeNull();
  });
  it('reloads authoritative data after a rejected move', () => {
    const { component, response } = setup(); component.moveCard(todo, 'EM_ANDAMENTO'); response.error(new Error('conflict'));
    expect(component.movingId).toBeNull(); expect(component.carregarLista).toHaveBeenCalledOnce();
    expect(component.toast.add).toHaveBeenCalledWith(expect.objectContaining({ severity: 'error' }));
  });
  it('collapses only empty columns and allows reopening them', () => {
    const { component } = setup();
    expect(component.isCollapsed('A_FAZER')).toBe(false);
    expect(component.isCollapsed('CONCLUIDO')).toBe(true);
    component.toggleColumn('CONCLUIDO'); expect(component.isCollapsed('CONCLUIDO')).toBe(false);
  });
  it('does not open the detail as a side effect of dropping a card', () => {
    const { component } = setup(); component.endDrag(); component.abrirOs(todo);
    expect(component.router.navigate).not.toHaveBeenCalled();
  });
});
