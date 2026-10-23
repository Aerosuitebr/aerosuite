import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { map } from 'rxjs/operators';
import { OsFluxoPermissaoService } from '../os/fluxo/os-fluxo-permissao.service';

export const OS_FLUXO_FUNCIONALIDADE = {
  PAINEL: 'OS_FLUXO_PAINEL',
  ESTACAO: 'OS_FLUXO_ESTACAO',
  AJUSTE: 'OS_FLUXO_AJUSTE',
  CODIGOS: 'OS_FLUXO_CODIGOS',
  ESTACOES: 'OS_FLUXO_ESTACOES'
} as const;

export const OS_FLUXO_FUNCIONALIDADES_ALL: readonly string[] = Object.values(OS_FLUXO_FUNCIONALIDADE);

/** Exige alguma das funcionalidades de route.data.funcionalidades (padrão: qualquer funcionalidade do fluxo). */
export const fluxoOsGuard: CanActivateFn = (route) => {
  const funcionalidades = inject(OsFluxoPermissaoService);
  const router = inject(Router);
  const toast = inject(MessageService);
  const exigidas = (route.data['funcionalidades'] as string[] | undefined) ?? OS_FLUXO_FUNCIONALIDADES_ALL;

  return funcionalidades.ensureLoaded().pipe(
    map((codes) => {
      if (exigidas.some((c) => codes.has(c))) return true;
      toast.add({
        severity: 'warn',
        summary: 'Acesso restrito',
        detail: 'Seu perfil não possui permissão para esta funcionalidade do fluxo da OS.',
        life: 6000
      });
      return router.createUrlTree(['/home']);
    })
  );
};
