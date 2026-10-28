import '@angular/compiler';
import { describe, expect, it, vi } from 'vitest';
import { OSListComponent } from './os-list.component';
import type { OS } from '../core/os.service';

function setup(canNrc = true) {
  return Object.assign(Object.create(OSListComponent.prototype), {
    i18n: { translate: (key: string) => key }, podeNrc: () => canNrc,
    editOS: vi.fn(), printOS: vi.fn(), abrirNrc: vi.fn(), abrirNaoConformidades: vi.fn(), confirmDelete: vi.fn()
  }) as any;
}
describe('OS contextual actions', () => {
  it('preserves row-level edit and delete restrictions', () => {
    const component = setup(false);
    const actions = component.actionsFor({ podeEditar: false, escopoEdicao: 'LIMITADO' } as OS);
    expect(actions.map((item: any) => item.icon)).toEqual(['pi pi-print']);
  });
  it('runs commands for the selected row and keeps deletion behind confirmation', () => {
    const component = setup();
    const row = { id: 27, escopoEdicao: 'TOTAL' } as OS;
    const actions = component.actionsFor(row);
    for (const action of actions) action.command?.({});
    for (const method of ['editOS','printOS','abrirNrc','confirmDelete']) expect(component[method]).toHaveBeenCalledWith(row);
  });
  it('does not reuse the previous row when reopening the menu', () => {
    const component = setup();
    const menu = { toggle: vi.fn() };
    component.openRowActions(new Event('click'), { id: 1 } as OS, menu);
    component.openRowActions(new Event('click'), { id: 2, podeEditar: false } as OS, menu);
    expect(component.rowActions.some((item:any) => item.icon === 'pi pi-pencil')).toBe(false);
    component.rowActions.find((item:any) => item.icon === 'pi pi-print').command({});
    expect(component.printOS).toHaveBeenCalledWith({ id: 2, podeEditar: false });
  });
  it('shows an active-filter count even while the advanced panel is closed', () => {
    const component = setup();
    component.filtroFila = 'TODAS'; component.filtroStatus = null;
    expect(component.activeAdvancedFilters).toBe(0);
    component.filtroFila = 'SEM_MECANICO'; component.filtroStatus = 'PAUSADA';
    expect(component.activeAdvancedFilters).toBe(2);
  });
});
