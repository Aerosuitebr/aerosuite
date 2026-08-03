import { ChangeDetectorRef, Pipe, PipeTransform, inject, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { LocaleCurrencyService } from './locale-currency.service';
import { TranslationService } from '../translation.service';

type LocaleDateTimeMode = 'time' | 'date' | 'dateTime' | 'dateNumeric' | 'clockCaption';

/**
 * Datas/horas no fuso do país do idioma selecionado.
 * Uso: {{ someDate | localeDateTime:'date' }}
 */
@Pipe({ name: 'localeDateTime', standalone: true, pure: false })
export class LocaleDateTimePipe implements PipeTransform, OnDestroy {
  private readonly localeCurrency = inject(LocaleCurrencyService);
  private readonly i18n = inject(TranslationService);
  private readonly cdr = inject(ChangeDetectorRef);
  private lang = this.i18n.getCurrentLanguage();
  private langSub?: Subscription;
  private profileSub?: Subscription;

  constructor() {
    this.langSub = this.i18n.getCurrentLanguage$().subscribe((l) => {
      this.lang = l;
      this.cdr.markForCheck();
    });
    this.profileSub = this.localeCurrency.profile$.subscribe(() => this.cdr.markForCheck());
  }

  transform(value: Date | string | number | null | undefined, mode: LocaleDateTimeMode = 'dateTime'): string {
    void this.lang;
    const profile = this.localeCurrency.getProfile();
    const tz = profile.timeZone;
    const intl = profile.intlLocale;

    if (mode === 'clockCaption') {
      const snap = this.localeCurrency.getLiveClockSnapshot();
      return this.i18n.translate('locale.clock.caption', {
        time: snap.time,
        tz: snap.timezoneLabel
      });
    }

    const d = value == null ? new Date() : value instanceof Date ? value : new Date(value);
    if (isNaN(d.getTime())) {
      return '';
    }

    switch (mode) {
      case 'time':
        return d.toLocaleTimeString(intl, {
          timeZone: tz,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit'
        });
      case 'date':
        return d.toLocaleDateString(intl, {
          timeZone: tz,
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric'
        });
      case 'dateNumeric':
        return d.toLocaleDateString(intl, {
          timeZone: tz,
          year: 'numeric',
          month: 'numeric',
          day: 'numeric'
        });
      default:
        return d.toLocaleString(intl, {
          timeZone: tz,
          dateStyle: 'short',
          timeStyle: 'short'
        });
    }
  }

  ngOnDestroy(): void {
    this.langSub?.unsubscribe();
    this.profileSub?.unsubscribe();
  }
}
