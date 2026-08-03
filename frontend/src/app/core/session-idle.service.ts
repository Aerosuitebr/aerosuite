import { Injectable, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';
import { TranslationService } from './translation.service';

/** Encerra sessão após inatividade (padrão 30 min) — achado A32 homologação UX. */
@Injectable({ providedIn: 'root' })
export class SessionIdleService {
  private readonly idleMs = 30 * 60 * 1000;
  private timer: ReturnType<typeof setTimeout> | null = null;
  private started = false;
  private readonly auth = inject(AuthService);
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);

  startMonitoring(): void {
    if (this.started || typeof window === 'undefined') {
      return;
    }
    this.started = true;
    const reset = () => {
      if (!this.auth.isAuthenticated()) {
        return;
      }
      if (this.timer) {
        clearTimeout(this.timer);
      }
      this.timer = setTimeout(() => this.expireSession(), this.idleMs);
    };
    for (const ev of ['click', 'keydown', 'mousemove', 'scroll', 'touchstart'] as const) {
      window.addEventListener(ev, reset, { passive: true });
    }
    reset();
  }

  private expireSession(): void {
    if (!this.auth.isAuthenticated()) {
      return;
    }
    this.auth.logout();
    void this.router.navigate(['/login'], {
      queryParams: { sessionExpired: '1' },
    });
  }
}
