import { Injectable, inject } from '@angular/core';
import { PrimeNGConfig } from 'primeng/api';
import { TranslationService } from './translation.service';

/** Sincroniza textos padrão do PrimeNG (autocomplete, dropdown, etc.) com o idioma ativo. */
@Injectable({ providedIn: 'root' })
export class PrimeNgI18nService {
  private primeng = inject(PrimeNGConfig);
  private i18n = inject(TranslationService);

  sync(): void {
    const empty = this.i18n.translate('primeng.emptySearch');
    this.primeng.setTranslation({
      emptySearchMessage: empty,
      emptyMessage: this.i18n.translate('primeng.emptyMessage'),
      emptyFilterMessage: empty
    });
  }
}
