import '@angular/compiler';
import { DestroyRef, Injector, runInInjectionContext } from '@angular/core';
import { Router } from '@angular/router';
import { Subject } from 'rxjs';
import { describe, it, expect, vi, afterEach } from 'vitest';
import { NrcDashboardComponent } from './nrc-dashboard.component';
import { NrcDashboard, NrcService } from '../core/nrc.service';
import { TranslationService } from '../core/translation.service';

function setup() {
  const responses: Subject<NrcDashboard>[] = [];
  const service = { dashboard: vi.fn(() => { const response = new Subject<NrcDashboard>(); responses.push(response); return response; }) };
  const router = { navigate: vi.fn() };
  const injector = Injector.create({ providers: [
    { provide: NrcService, useValue: service },
    { provide: Router, useValue: router },
    { provide: TranslationService, useValue: { translate: (key: string) => key } },
    { provide: DestroyRef, useValue: { onDestroy: () => () => {} } }
  ] });
  const component = runInInjectionContext(injector, () => new NrcDashboardComponent());
  return { component, service, router, responses };
}

afterEach(() => vi.useRealTimers());

describe('RNC dashboard period', () => {
  it('uses calendar months and sends the complete range to the API', () => {
    vi.useFakeTimers(); vi.setSystemTime(new Date(2026, 9, 27, 12));
    const { component, service } = setup();
    component.ngOnInit();
    expect(service.dashboard).toHaveBeenLastCalledWith({ dataInicio: '2026-05-01', dataFim: '2026-10-27' });
    component.period = '3'; component.changePeriod();
    expect(service.dashboard).toHaveBeenLastCalledWith({ dataInicio: '2026-08-01', dataFim: '2026-10-27' });
  });
  it('rejects inverted or incomplete ranges without querying', () => {
    const { component, service } = setup();
    component.dataInicio = '2026-10-27'; component.dataFim = '2026-10-01'; component.datesChanged();
    expect(component.validRange).toBe(false);
    expect(service.dashboard).not.toHaveBeenCalled();
    component.dataFim = ''; component.datesChanged();
    expect(service.dashboard).not.toHaveBeenCalled();
  });
  it('cancels a previous query when the period changes', () => {
    const { component, responses } = setup();
    component.ngOnInit(); component.period = '12'; component.changePeriod();
    const current = { total: 7 } as NrcDashboard;
    responses[1].next(current); responses[0].next({ total: 100 } as NrcDashboard);
    expect(component.data).toBe(current);
  });
  it('preserves period and operational scope when opening records', () => {
    const { component, router } = setup();
    component.dataInicio = '2026-01-01'; component.dataFim = '2026-10-27';
    component.open({ emTratamento: 'true' });
    expect(router.navigate).toHaveBeenCalledWith(['/nrc'], { queryParams: { dataInicio: '2026-01-01', dataFim: '2026-10-27', emTratamento: 'true' } });
  });
});
