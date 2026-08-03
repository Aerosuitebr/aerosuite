import { ChangeDetectorRef, Pipe, PipeTransform, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from './translation.service';

@Pipe({
  name: 'translate',
  standalone: true,
  pure: false
})
export class TranslatePipe implements PipeTransform, OnDestroy {
  private readonly i18n = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);
  /** Referência ao idioma atual para o pipe impuro reavaliar ao trocar idioma. */
  private lang = this.i18n.getCurrentLanguage();
  private readonly langSub: Subscription = this.i18n.getCurrentLanguage$().subscribe((l) => {
    this.lang = l;
    this.cdr.markForCheck();
  });

  transform(key: string, params?: Record<string, string>): string {
    void this.lang;
    if (!key) {
      return '';
    }
    return this.i18n.translate(key, params);
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
  }
}
