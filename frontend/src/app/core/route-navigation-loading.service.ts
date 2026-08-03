import { Injectable, inject, signal } from '@angular/core';
import { NavigationCancel, NavigationEnd, NavigationError, NavigationStart, Router } from '@angular/router';

/**
 * Indica navegação entre rotas (lazy chunks + activate) para feedback visual no layout.
 */
@Injectable({ providedIn: 'root' })
export class RouteNavigationLoadingService {
  private readonly router = inject(Router);
  private pending = 0;
  private showTimer: ReturnType<typeof setTimeout> | null = null;

  /** true após ~120ms de navegação pendente (evita flash em trocas instantâneas). */
  readonly active = signal(false);

  constructor() {
    this.router.events.subscribe((event) => {
      if (event instanceof NavigationStart) {
        this.pending++;
        if (this.pending === 1 && !this.showTimer) {
          this.showTimer = setTimeout(() => {
            this.showTimer = null;
            if (this.pending > 0) {
              this.active.set(true);
            }
          }, 120);
        }
        return;
      }
      if (
        event instanceof NavigationEnd ||
        event instanceof NavigationCancel ||
        event instanceof NavigationError
      ) {
        this.pending = Math.max(0, this.pending - 1);
        if (this.pending === 0) {
          if (this.showTimer) {
            clearTimeout(this.showTimer);
            this.showTimer = null;
          }
          this.active.set(false);
        }
      }
    });
  }
}
