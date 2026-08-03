import type { SupportedUiLocale } from '../supported-ui-languages';

export type MoneyCurrency = 'BRL' | 'USD' | 'EUR';

export interface UiLocaleProfile {
  locale: SupportedUiLocale;
  /** IANA timezone (ex.: America/Sao_Paulo) */
  timeZone: string;
  /** Chave i18n do rótulo do fuso exibido no relógio */
  timezoneLabelKey: string;
  /** Moeda preferida na interface para valores monetários */
  displayCurrency: MoneyCurrency;
  /** Locale BCP 47 para Intl (datas/números) */
  intlLocale: string;
}

const PROFILES: Record<SupportedUiLocale, UiLocaleProfile> = {
  'pt-BR': {
    locale: 'pt-BR',
    timeZone: 'America/Sao_Paulo',
    timezoneLabelKey: 'locale.region.tz.pt-BR',
    displayCurrency: 'BRL',
    intlLocale: 'pt-BR'
  },
  'en-US': {
    locale: 'en-US',
    timeZone: 'America/New_York',
    timezoneLabelKey: 'locale.region.tz.en-US',
    displayCurrency: 'USD',
    intlLocale: 'en-US'
  },
  'es-ES': {
    locale: 'es-ES',
    timeZone: 'Europe/Madrid',
    timezoneLabelKey: 'locale.region.tz.es-ES',
    displayCurrency: 'EUR',
    intlLocale: 'es-ES'
  },
  'fr-FR': {
    locale: 'fr-FR',
    timeZone: 'Europe/Paris',
    timezoneLabelKey: 'locale.region.tz.fr-FR',
    displayCurrency: 'EUR',
    intlLocale: 'fr-FR'
  }
};

export function getLocaleProfile(lang: string): UiLocaleProfile {
  if (lang in PROFILES) {
    return PROFILES[lang as SupportedUiLocale];
  }
  return PROFILES['pt-BR'];
}

/** Normaliza strings vindas da API (ex.: moeda da invoice) para o conjunto suportado. */
export function coerceMoneyCurrency(
  value: MoneyCurrency | string | null | undefined,
  fallback: MoneyCurrency = 'USD'
): MoneyCurrency {
  if (value === 'BRL' || value === 'USD' || value === 'EUR') {
    return value;
  }
  if (value == null || value === '') {
    return fallback;
  }
  const u = String(value).trim().toUpperCase();
  if (u === 'BRL' || u === 'USD' || u === 'EUR') {
    return u;
  }
  return fallback;
}
