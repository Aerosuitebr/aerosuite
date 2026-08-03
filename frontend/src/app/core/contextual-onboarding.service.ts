import { Injectable, inject } from '@angular/core';
import { NavigationEnd, Router } from '@angular/router';
import { filter } from 'rxjs/operators';
import { CONTEXTUAL_ONBOARDING_TIPS, type ContextualOnboardingTip } from './contextual-onboarding.config';
import { TranslationService } from './translation.service';

const STORAGE_KEY = 'as-contextual-onboarding-dismissed';

@Injectable({ providedIn: 'root' })
export class ContextualOnboardingService {
  private readonly router = inject(Router);
  private readonly i18n = inject(TranslationService);

  private dismissed = new Set<string>(this.readDismissed());
  activeTip: ContextualOnboardingTip | null = null;

  constructor() {
    this.router.events.pipe(filter((e): e is NavigationEnd => e instanceof NavigationEnd)).subscribe(() => {
      this.syncActiveTip();
    });
    this.syncActiveTip();
  }

  dismiss(tipId: string): void {
    this.dismissed.add(tipId);
    localStorage.setItem(STORAGE_KEY, JSON.stringify([...this.dismissed]));
    if (this.activeTip?.id === tipId) {
      this.activeTip = null;
    }
  }

  title(tip: ContextualOnboardingTip): string {
    return this.i18n.translate(tip.titleKey);
  }

  body(tip: ContextualOnboardingTip): string {
    return this.i18n.translate(tip.bodyKey);
  }

  private syncActiveTip(): void {
    const path = this.router.url.split('?')[0];
    const match = CONTEXTUAL_ONBOARDING_TIPS.find(
      tip => !this.dismissed.has(tip.id) && path.startsWith(tip.routePrefix)
    );
    this.activeTip = match ?? null;
  }

  private readDismissed(): string[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) {
        return [];
      }
      const parsed = JSON.parse(raw) as unknown;
      return Array.isArray(parsed) ? parsed.filter((x): x is string => typeof x === 'string') : [];
    } catch {
      return [];
    }
  }
}
