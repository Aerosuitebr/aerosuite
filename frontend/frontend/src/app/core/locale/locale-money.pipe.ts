import { ChangeDetectorRef, Pipe, PipeTransform, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LocaleCurrencyService, MoneyDisplayResult, FormatMoneyOptions } from './locale-currency.service';
import { MoneyCurrency, coerceMoneyCurrency } from './locale-region.config';
import { TranslationService } from '../translation.service';

/**
 * Formata valores monetários na moeda do idioma atual, com conversão discriminada.
 * Uso: {{ price | localeMoney:'USD' }}
 *      {{ price | localeMoney:'BRL':{ showFootnote: true, footnoteStyle: 'full' } }}
 */
@Pipe({ name: 'localeMoney', standalone: true, pure: false })
export class LocaleMoneyPipe implements PipeTransform, OnDestroy {
  private readonly localeMoney = inject(LocaleCurrencyService);
  private readonly i18n = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private lang = this.i18n.getCurrentLanguage();
  private profileSub?: Subscription;
  private langSub?: Subscription;

  constructor() {
    this.langSub = this.i18n.getCurrentLanguage$().subscribe((l) => {
      this.lang = l;
      this.cdr.markForCheck();
    });
    this.profileSub = this.localeMoney.profile$.subscribe(() => this.cdr.markForCheck());
  }

  transform(
    value: number | null | undefined,
    sourceCurrency: MoneyCurrency | string = 'USD',
    options?: FormatMoneyOptions & { mode?: 'amount' | 'footnote' }
  ): string {
    void this.lang;
    const src = coerceMoneyCurrency(sourceCurrency);
    const { mode, ...fmt } = options ?? {};
    const result = this.localeMoney.formatMoney(value, src, fmt);
    if (mode === 'footnote') {
      return result.conversionFootnote;
    }
    if (options?.showFootnote && result.conversionFootnote) {
      return `${result.formatted} (${result.conversionFootnote})`;
    }
    return result.formatted;
  }

  /** Para templates que precisam do objeto completo (ex.: tooltip). */
  static toDisplay(
    service: LocaleCurrencyService,
    value: number | null | undefined,
    sourceCurrency: MoneyCurrency,
    options?: FormatMoneyOptions
  ): MoneyDisplayResult {
    return service.formatMoney(value, sourceCurrency, options);
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }
}
