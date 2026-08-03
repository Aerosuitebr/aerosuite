import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, timer } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { CotacaoDolar, CotacaoService } from '../cotacao.service';
import { TranslationService } from '../translation.service';
import { getLocaleProfile, MoneyCurrency, UiLocaleProfile } from './locale-region.config';

/** Opções de formatação (sem `mode` — usado só pelo pipe). */
export interface FormatMoneyOptions {
  showFootnote?: boolean;
  /** `sources` = só fonte/taxa (sem repetir o valor convertido na nota). */
  footnoteStyle?: 'full' | 'short' | 'sources';
  minFractionDigits?: number;
  maxFractionDigits?: number;
}

export interface MoneyDisplayResult {
  /** Valor formatado na moeda de exibição do idioma */
  formatted: string;
  displayCurrency: MoneyCurrency;
  sourceCurrency: MoneyCurrency;
  sourceAmount: number;
  displayAmount: number;
  /** Texto discriminando origem da conversão (vazio se não houve conversão) */
  conversionFootnote: string;
  converted: boolean;
}

export interface LiveClockSnapshot {
  time: string;
  date: string;
  timeZone: string;
  timezoneLabel: string;
}

interface EurUsdRate {
  usdPerEur: number;
  date: string;
  estimated: boolean;
}

@Injectable({ providedIn: 'root' })
export class LocaleCurrencyService {
  private readonly http = inject(HttpClient);
  private readonly cotacaoService = inject(CotacaoService);
  private readonly i18n = inject(TranslationService);

  private profile: UiLocaleProfile = getLocaleProfile(this.i18n.getCurrentLanguage());
  private bcb: CotacaoDolar | null = null;
  private eur: EurUsdRate | null = null;
  private ratesReady$ = new BehaviorSubject<boolean>(false);

  readonly profile$ = new BehaviorSubject<UiLocaleProfile>(this.profile);

  constructor() {
    this.i18n.getCurrentLanguage$().subscribe((lang) => {
      this.profile = getLocaleProfile(lang);
      this.profile$.next(this.profile);
    });
  }

  getProfile(): UiLocaleProfile {
    return this.profile;
  }

  getDisplayCurrency(): MoneyCurrency {
    return this.profile.displayCurrency;
  }

  getIntlLocale(): string {
    return this.profile.intlLocale;
  }

  getTimeZone(): string {
    return this.profile.timeZone;
  }

  /** Carrega/atualiza taxas BCB (BRL/USD) e Frankfurter (USD/EUR). */
  refreshRates(): Observable<void> {
    return this.cotacaoService.getCotacaoDolar().pipe(
      catchError(() => of(null)),
      tap((bcb) => {
        if (bcb) {
          this.bcb = bcb;
        }
        this.ratesReady$.next(!!this.bcb);
      }),
      switchMap(() =>
        timer(2_500).pipe(
          switchMap(() => this.fetchUsdEur().pipe(catchError(() => of(null)))),
          tap((eur) => {
            if (eur) {
              this.eur = eur;
            }
          })
        )
      ),
      map(() => void 0)
    );
  }

  getLiveClockSnapshot(now = new Date()): LiveClockSnapshot {
    const tz = this.profile.timeZone;
    const intl = this.profile.intlLocale;
    const time = now.toLocaleTimeString(intl, {
      timeZone: tz,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
    const date = this.formatFooterDate(now, intl, tz);
    return {
      time,
      date,
      timeZone: tz,
      timezoneLabel: this.i18n.translate(this.profile.timezoneLabelKey)
    };
  }

  private formatFooterDate(now: Date, intl: string, timeZone: string): string {
    const raw = now.toLocaleDateString(intl, {
      timeZone,
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric'
    });
    if (intl.startsWith('pt') || intl.startsWith('es')) {
      const comma = raw.indexOf(',');
      if (comma > 0) {
        const weekday = raw.slice(0, comma).trim();
        const rest = raw.slice(comma + 1).trim().toLowerCase();
        return `${weekday}, ${rest}`;
      }
    }
    return raw;
  }

  /**
   * Formata valor na moeda do idioma atual, convertendo se necessário e gerando nota de origem.
   */
  formatMoney(
    amount: number | null | undefined,
    sourceCurrency: MoneyCurrency,
    options?: FormatMoneyOptions
  ): MoneyDisplayResult {
    const src = sourceCurrency;
    const safe = amount ?? 0;
    const display = this.profile.displayCurrency;
    const frac = this.resolveFractionDigits(options);

    if (src === display) {
      return {
        formatted: this.formatRaw(safe, display, frac),
        displayCurrency: display,
        sourceCurrency: src,
        sourceAmount: safe,
        displayAmount: safe,
        conversionFootnote: '',
        converted: false
      };
    }

    const converted = this.convertAmount(safe, src, display);
    const meta = this.buildConversionMeta(src, display);
    const formatted = this.formatRaw(converted, display, frac);
    const originalFormatted = this.formatRaw(safe, src, frac);

    let conversionFootnote = '';
    if (options?.showFootnote !== false) {
      const style = options?.footnoteStyle ?? 'short';
      if (style === 'full') {
        conversionFootnote = this.i18n.translate('locale.money.footnote', {
          original: originalFormatted,
          converted: formatted,
          from: src,
          to: display,
          source: meta.sourceLabel,
          rate: meta.rateDetail
        });
      } else if (style === 'sources') {
        conversionFootnote = [meta.sourceLabel, meta.rateDetail]
          .filter((s) => s && String(s).trim() && String(s).trim() !== '-')
          .join(' | ');
      } else {
        conversionFootnote = this.i18n.translate('locale.money.footnoteShort', {
          converted: formatted,
          source: meta.sourceLabel
        });
      }
    }

    return {
      formatted,
      displayCurrency: display,
      sourceCurrency: src,
      sourceAmount: safe,
      displayAmount: converted,
      conversionFootnote,
      converted: true
    };
  }

  formatRaw(
    amount: number,
    currency: MoneyCurrency,
    fraction?: { min: number; max: number }
  ): string {
    const min = fraction?.min ?? 2;
    const max = fraction?.max ?? 2;
    return new Intl.NumberFormat(this.profile.intlLocale, {
      style: 'currency',
      currency,
      minimumFractionDigits: min,
      maximumFractionDigits: max
    }).format(amount);
  }

  private resolveFractionDigits(options?: FormatMoneyOptions): { min: number; max: number } {
    const min = options?.minFractionDigits ?? 2;
    const max = options?.maxFractionDigits ?? 2;
    return { min, max: Math.max(min, max) };
  }

  /** Converte entre moedas suportadas usando as mesmas taxas da interface (BCB / Frankfurter). */
  convertBetween(amount: number, from: MoneyCurrency, to: MoneyCurrency): number {
    return this.convertAmount(amount, from, to);
  }

  /**
   * Uma linha com fontes e taxas usadas ao exibir `from` na moeda atual do idioma.
   * Ex.: PTAX do BCB + Frankfurter ao ir de USD para EUR em es-ES.
   */
  getRateSourcesLine(from: MoneyCurrency): string {
    const to = this.profile.displayCurrency;
    if (from === to) {
      return '';
    }
    const meta = this.buildConversionMeta(from, to);
    return [meta.sourceLabel, meta.rateDetail].filter((s) => s && String(s).trim()).join(' | ');
  }

  /**
   * Nota sob preços de catálogo (ex.: produtos gravados em USD).
   * Inclui fonte da conversão quando a UI usa outra moeda; se coincidir, mostra taxas de referência.
   */
  getCatalogPriceFootnote(
    amount: number | null | undefined,
    storedCurrency: MoneyCurrency = 'USD'
  ): string {
    const result = this.formatMoney(amount, storedCurrency, {
      showFootnote: true,
      footnoteStyle: 'sources'
    });
    if (result.conversionFootnote?.trim()) {
      return result.conversionFootnote.trim();
    }
    return this.buildStoredCurrencySourceNote(storedCurrency);
  }

  private buildStoredCurrencySourceNote(stored: MoneyCurrency): string {
    const parts: string[] = [
      this.i18n.translate('locale.money.storedIn', { currency: stored })
    ];
    const seen = new Set<string>();
    const add = (label: string) => {
      const t = label?.trim();
      if (t && !seen.has(t)) {
        seen.add(t);
        parts.push(t);
      }
    };
    add(this.eurSourceLabel());
    add(this.bcbSourceLabel());
    const cross = this.getRateSourcesLine(stored);
    if (cross) {
      add(cross);
    }
    return parts.join(' | ');
  }

  private convertAmount(amount: number, from: MoneyCurrency, to: MoneyCurrency): number {
    if (from === to) {
      return amount;
    }
    const inUsd = this.toUsd(amount, from);
    return this.fromUsd(inUsd, to);
  }

  private toUsd(amount: number, from: MoneyCurrency): number {
    switch (from) {
      case 'USD':
        return amount;
      case 'BRL': {
        const rate = this.bcb?.cotacaoVenda ?? 5;
        return rate > 0 ? amount / rate : amount;
      }
      case 'EUR': {
        const usdPerEur = this.eur?.usdPerEur ?? 1.08;
        return usdPerEur > 0 ? amount * usdPerEur : amount;
      }
      default:
        return amount;
    }
  }

  private fromUsd(amountUsd: number, to: MoneyCurrency): number {
    switch (to) {
      case 'USD':
        return amountUsd;
      case 'BRL': {
        const rate = this.bcb?.cotacaoVenda ?? 5;
        return amountUsd * rate;
      }
      case 'EUR': {
        const usdPerEur = this.eur?.usdPerEur ?? 1.08;
        return usdPerEur > 0 ? amountUsd / usdPerEur : amountUsd;
      }
      default:
        return amountUsd;
    }
  }

  private buildConversionMeta(
    from: MoneyCurrency,
    to: MoneyCurrency
  ): { sourceLabel: string; rateDetail: string } {
    const parts: string[] = [];
    const rates: string[] = [];

    const usesBcb = from === 'BRL' || to === 'BRL';
    const usesEur = from === 'EUR' || to === 'EUR';

    if (usesBcb) {
      parts.push(this.bcbSourceLabel());
      if (this.bcb?.cotacaoVenda) {
        rates.push(`1 USD = ${this.bcb.cotacaoVenda.toFixed(4)} BRL`);
      }
    }
    if (usesEur) {
      parts.push(this.eurSourceLabel());
      if (this.eur?.usdPerEur) {
        rates.push(`1 EUR = ${this.eur.usdPerEur.toFixed(4)} USD`);
      }
    }

    return {
      sourceLabel: parts.join(' + ') || this.i18n.translate('locale.money.noConversion', { currency: to }),
      rateDetail: rates.join('; ') || '-'
    };
  }

  private bcbSourceLabel(): string {
    if (!this.bcb) {
      return this.i18n.translate('locale.money.origin.bcbEstimated');
    }
    const date = this.formatRateDate(this.bcb.dataHoraCotacao);
    return this.i18n.translate('locale.money.origin.bcb', { date });
  }

  private eurSourceLabel(): string {
    if (!this.eur) {
      return this.i18n.translate('locale.money.origin.frankfurterEstimated');
    }
    return this.i18n.translate('locale.money.origin.frankfurter', {
      date: this.eur.date
    });
  }

  private formatRateDate(iso: string): string {
    try {
      const d = new Date(iso);
      return d.toLocaleDateString(this.profile.intlLocale, {
        timeZone: this.profile.timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    } catch {
      return iso;
    }
  }

  private fetchUsdEur(): Observable<EurUsdRate> {
    return this.http
      .get<{ date: string; rates: { EUR: number } }>(
        'https://api.frankfurter.app/latest?from=USD&to=EUR'
      )
      .pipe(
        map((res) => {
          const eurPerUsd = res.rates?.EUR ?? 0.92;
          const usdPerEur = eurPerUsd > 0 ? 1 / eurPerUsd : 1.08;
          return {
            usdPerEur,
            date: res.date,
            estimated: false
          };
        }),
        catchError(() =>
          of({
            usdPerEur: 1.08,
            date: new Date().toISOString().slice(0, 10),
            estimated: true
          })
        )
      );
  }
}
