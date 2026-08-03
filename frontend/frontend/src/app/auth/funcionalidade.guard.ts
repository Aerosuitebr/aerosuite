import { Injectable } from '@angular/core';
import {
  ActivatedRouteSnapshot,
  CanActivate,
  Router,
  RouterStateSnapshot,
} from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';
import { TranslationService } from '../core/translation.service';
import { passesPermissaoRota, PermissaoRota } from './permissao.util';

export type { PermissaoRota } from './permissao.util';

@Injectable({ providedIn: 'root' })
export class FuncionalidadeGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private router: Router,
    private messageService: MessageService,
    private i18n: TranslationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const perm = route.data['perm'] as PermissaoRota | undefined;
    if (
      !perm ||
      (!perm.funcionalidadesAny?.length &&
        !perm.funcionalidadesAll?.length &&
        !perm.funcionalidadesPrefix?.length)
    ) {
      return true;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (!passesPermissaoRota(user, perm)) {
      this.negar(state.url);
      return false;
    }

    return true;
  }

  private negar(returnUrl: string): void {
    this.i18n.addToast(
      this.messageService,
      'warn',
      'auth.guard.funcionalidade.summary',
      'auth.guard.funcionalidade.detail'
    );
    this.router.navigate([''], { replaceUrl: true });
  }
}
