import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { PlatformOpsAuthService } from './platform-ops-auth.service';
import { TranslationService } from '../core/translation.service';

export const platformOpsGuard: CanActivateFn = () => {
  const auth = inject(PlatformOpsAuthService);
  const router = inject(Router);
  const messages = inject(MessageService);
  const i18n = inject(TranslationService);

  if (auth.isAuthenticated()) {
    return true;
  }

  i18n.addToast(messages, 'warn', 'common.toast.warn', 'platformOps.guard.required');
  void router.navigate(['/plataforma/acesso']);
  return false;
};
