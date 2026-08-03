import { Injectable } from '@angular/core';
import { CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';
import { TranslationService } from '../core/translation.service';
import { FuncionalidadeGuard } from './funcionalidade.guard';
import { ActivatedRouteSnapshot } from '@angular/router';

/** Tenant default (id=1) — operador da plataforma SaaS. */
const PLATFORM_TENANT_ID = 1;

@Injectable({ providedIn: 'root' })
export class PlatformOperatorGuard implements CanActivate {
  constructor(
    private authService: AuthService,
    private funcGuard: FuncionalidadeGuard,
    private router: Router,
    private messageService: MessageService,
    private i18n: TranslationService
  ) {}

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    if (!this.funcGuard.canActivate(route, state)) {
      return false;
    }
    const user = this.authService.getCurrentUser();
    const tid = user?.tenantId ?? PLATFORM_TENANT_ID;
    if (tid !== PLATFORM_TENANT_ID) {
      this.i18n.addToast(
        this.messageService,
        'warn',
        'common.toast.warn',
        'tenants.guard.denied'
      );
      this.router.navigate([''], { replaceUrl: true });
      return false;
    }
    return true;
  }
}
