import { Injectable, inject } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { MessageService } from 'primeng/api';
import { AuthService } from './auth.service';
import { TranslationService } from '../core/translation.service';
import { passesTenantFeatureRota, TenantFeatureRota } from '../core/tenant-feature.util';

export type { TenantFeatureRota } from '../core/tenant-feature.util';

@Injectable({ providedIn: 'root' })
export class TenantFeatureGuard implements CanActivate {
  private authService = inject(AuthService);
  private router = inject(Router);
  private messageService = inject(MessageService);
  private i18n = inject(TranslationService);

  canActivate(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): boolean {
    const req = route.data['tenantFeature'] as TenantFeatureRota | undefined;
    if (!req?.tenantFeaturesAny?.length && !req?.tenantFeaturesAll?.length) {
      return true;
    }

    const user = this.authService.getCurrentUser();
    if (!user) {
      this.router.navigate(['/login'], { queryParams: { returnUrl: state.url } });
      return false;
    }

    if (!passesTenantFeatureRota(user, req)) {
      this.i18n.addToast(
        this.messageService,
        'warn',
        'auth.guard.tenantFeature.summary',
        'auth.guard.tenantFeature.detail'
      );
      this.router.navigate([''], { replaceUrl: true });
      return false;
    }

    return true;
  }
}
