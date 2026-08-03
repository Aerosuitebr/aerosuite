import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SistemaEmpresaService } from '../core/sistema-empresa.service';

/**
 * Se a empresa ainda não concluiu o assistente e o utilizador é administrativo,
 * redireciona para a configuração inicial antes do layout principal.
 */
export const empresaOnboardingGuard: CanActivateFn = (_route, state) => {
  const api = inject(SistemaEmpresaService);
  const router = inject(Router);
  const path = (state.url || '').split('?')[0];
  if (path.startsWith('/configuracao-empresa-inicial')) {
    return true;
  }
  return api.getStatusCached().pipe(
    map((s) => {
      if (!s.needsCompletion) {
        return true;
      }
      if (!s.canEdit) {
        return true;
      }
      return router.createUrlTree(['/configuracao-empresa-inicial'], {
        queryParams: { returnUrl: path || '/' },
      });
    }),
    catchError(() => of(true))
  );
};
