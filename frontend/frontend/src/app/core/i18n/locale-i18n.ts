import type { TranslationDictionary } from '../translation.service';

export const LOCALE_I18N_PT_BR: TranslationDictionary = {
  'locale.region.tz.pt-BR': 'Horário de Brasília',
  'locale.region.tz.en-US': 'Horário do leste dos EUA (Nova York)',
  'locale.region.tz.es-ES': 'Horário da Espanha (Madrid)',
  'locale.region.tz.fr-FR': 'Horário da França (Paris)',
  'locale.clock.caption': '{{time}} · {{tz}}',

  'locale.money.origin.bcb': 'Cotação PTAX venda - Banco Central do Brasil (BCB), {{date}}',
  'locale.money.origin.bcbEstimated': 'Cotação estimada (BCB indisponível)',
  'locale.money.origin.frankfurter': 'Taxa USD/EUR - Frankfurter (referência ECB), {{date}}',
  'locale.money.origin.frankfurterEstimated': 'Taxa USD/EUR estimada (Frankfurter indisponível)',
  'locale.money.footnote':
    'Original: {{original}}. Exibido: {{converted}}. Conversão: {{from}} -> {{to}} via {{source}} ({{rate}}).',
  'locale.money.footnoteShort': '~ {{converted}} | {{source}}',
  'locale.money.noConversion': 'Valor em {{currency}} (sem conversão).',
  'locale.money.storedIn': 'Valor em {{currency}} (catálogo)'
};

export const LOCALE_I18N_EN_US: TranslationDictionary = {
  'locale.region.tz.pt-BR': 'Brasília time',
  'locale.region.tz.en-US': 'US Eastern time (New York)',
  'locale.region.tz.es-ES': 'Spain time (Madrid)',
  'locale.region.tz.fr-FR': 'France time (Paris)',
  'locale.clock.caption': '{{time}} · {{tz}}',

  'locale.money.origin.bcb': 'PTAX selling rate - Central Bank of Brazil (BCB), {{date}}',
  'locale.money.origin.bcbEstimated': 'Estimated rate (BCB unavailable)',
  'locale.money.origin.frankfurter': 'USD/EUR rate - Frankfurter (ECB reference), {{date}}',
  'locale.money.origin.frankfurterEstimated': 'Estimated USD/EUR rate (Frankfurter unavailable)',
  'locale.money.footnote':
    'Original: {{original}}. Shown: {{converted}}. Conversion: {{from}} -> {{to}} via {{source}} ({{rate}}).',
  'locale.money.footnoteShort': '~ {{converted}} | {{source}}',
  'locale.money.noConversion': 'Amount in {{currency}} (no conversion).',
  'locale.money.storedIn': 'Amount in {{currency}} (catalog)'
};

export const LOCALE_I18N_ES_ES: TranslationDictionary = {
  'locale.clock.caption': '{{time}} · {{tz}}',
  'locale.money.footnote': 'Original: {{original}}. Mostrado: {{converted}}. Conversión: {{from}} -> {{to}} vía {{source}} ({{rate}}).',
  'locale.money.footnoteShort': '~ {{converted}} | {{source}}',
  'locale.money.noConversion': 'Importe en {{currency}} (sin conversión).',
  'locale.money.origin.bcb': 'Tipo PTAX venta - Banco Central de Brasil (BCB), {{date}}',
  'locale.money.origin.bcbEstimated': 'Tipo estimado (BCB no disponible)',
  'locale.money.origin.frankfurter': 'Tipo USD/EUR - Frankfurter (referencia BCE), {{date}}',
  'locale.money.origin.frankfurterEstimated': 'Tipo USD/EUR estimado (Frankfurter no disponible)',
  'locale.money.storedIn': 'Importe en {{currency}} (catálogo)',
  'locale.region.tz.en-US': 'Hora del este de EE. UU. (Nueva York)',
  'locale.region.tz.es-ES': 'Hora de España (Madrid)',
  'locale.region.tz.fr-FR': 'Hora de Francia (París)',
  'locale.region.tz.pt-BR': 'Hora de Brasilia',
};;

export const LOCALE_I18N_FR_FR: TranslationDictionary = {
  'locale.clock.caption': '{{time}} · {{tz}}',
  'locale.money.footnote': 'Original : {{original}}. Affiché : {{converted}}. Conversion : {{from}} -> {{to}} via {{source}} ({{rate}}).',
  'locale.money.footnoteShort': '~ {{converted}} | {{source}}',
  'locale.money.noConversion': 'Montant en {{currency}} (sans conversion).',
  'locale.money.origin.bcb': 'Taux PTAX vente - Banque centrale du Brésil (BCB), {{date}}',
  'locale.money.origin.bcbEstimated': 'Taux estimé (BCB indisponible)',
  'locale.money.origin.frankfurter': 'Taux USD/EUR - Frankfurter (référence BCE), {{date}}',
  'locale.money.origin.frankfurterEstimated': 'Taux USD/EUR estimé (Frankfurter indisponible)',
  'locale.money.storedIn': 'Montant en {{currency}} (catalogue)',
  'locale.region.tz.en-US': 'Heure de l’Est américain (New York)',
  'locale.region.tz.es-ES': 'Heure d’Espagne (Madrid)',
  'locale.region.tz.fr-FR': 'Heure de France (Paris)',
  'locale.region.tz.pt-BR': 'Heure de Brasilia',
};;
