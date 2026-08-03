import { Pipe, PipeTransform, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { TranslationService } from './translation.service';

/**
 * Traduz rótulos vindos de API/BD/enums pelo catálogo (ex.: perfil.label, lote.status).
 * Uso: {{ nome | uiLabel:'perfil.label':codigo }}
 * Tagline fixa: {{ '' | uiLabel:'tagline' }}
 */
@Pipe({
  name: 'uiLabel',
  standalone: true,
  pure: false
})
export class UiLabelPipe implements PipeTransform, OnDestroy {
  private readonly i18n = inject(TranslationService);
  private lang = this.i18n.getCurrentLanguage();
  private readonly langSub: Subscription = this.i18n.getCurrentLanguage$().subscribe((l) => {
    this.lang = l;
  });

  transform(
    fallback: string | null | undefined,
    catalog: string,
    code?: string | null | undefined
  ): string {
    void this.lang;
    if (catalog === 'tagline') {
      return this.i18n.translate('login.tagline');
    }
    return this.i18n.translateCatalog(catalog, code ?? fallback, fallback ?? undefined);
  }

  ngOnDestroy(): void {
    this.langSub.unsubscribe();
  }
}
