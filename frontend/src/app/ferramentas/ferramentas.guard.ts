import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { map } from 'rxjs';
import { AuthService } from '../auth/auth.service';
import { OsFluxoPermissaoService } from '../os/fluxo/os-fluxo-permissao.service';
import { podeAcessarFerramentaria } from './ferramentas-acesso';

export const ferramentasGuard: CanActivateFn = (route) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const funcoes = inject(OsFluxoPermissaoService);
  return funcoes.ensureLoaded().pipe(map(codes => {
    const pessoal = codes.has('FERRAMENTAS_MECANICO');
    if (route.data['pessoal']) return pessoal || router.createUrlTree(['/']);
    const visao = route.paramMap.get('visao') || 'estacao';
    const operador = podeAcessarFerramentaria(auth.getCurrentUser(), codes);
    if (operador && ['estacao', 'operacoes', 'acervo', 'calibracao', 'pendencias'].includes(visao)) return true;
    return router.createUrlTree(pessoal ? ['/ferramentas/minhas'] : ['/']);
  }));
};
