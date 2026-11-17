import '@angular/compiler';
import { Injector, runInInjectionContext } from '@angular/core';
import { ActivatedRouteSnapshot, Router, RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, of } from 'rxjs';
import { describe, expect, it, vi } from 'vitest';
import { SistemaEmpresaService } from '../core/sistema-empresa.service';
import { AuthService } from './auth.service';
import { empresaOnboardingGuard } from './empresa-onboarding.guard';

function checkDashboard(tenantSupport: boolean) {
  const status = vi.fn(() => of({ needsCompletion: true, canEdit: true }));
  const redirect = vi.fn(() => 'onboarding');
  const injector = Injector.create({ providers: [
    { provide: AuthService, useValue: { getCurrentUser: () => ({ tenantSupport }) } },
    { provide: SistemaEmpresaService, useValue: { getStatusCached: status } },
    { provide: Router, useValue: { createUrlTree: redirect } }
  ] });
  const result = runInInjectionContext(injector, () => empresaOnboardingGuard(
    {} as ActivatedRouteSnapshot, { url: '/' } as RouterStateSnapshot
  ));
  return { result, status, redirect };
}

describe('onboarding da organização', () => {
  it('abre o painel em sessão de suporte mesmo com configuração pendente', () => {
    const { result, status } = checkDashboard(true);
    expect(result).toBe(true);
    expect(status).not.toHaveBeenCalled();
  });

  it('continua exigindo a configuração do administrador da organização', async () => {
    const { result, redirect } = checkDashboard(false);
    expect(isObservable(result) ? await firstValueFrom(result) : result).toBe('onboarding');
    expect(redirect).toHaveBeenCalledWith(['/configuracao-empresa-inicial'], {
      queryParams: { returnUrl: '/' }
    });
  });
});
