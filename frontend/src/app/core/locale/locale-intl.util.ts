import { getLocaleProfile } from './locale-region.config';

export type UiDateFormatStyle = 'date' | 'dateTime' | 'dateTimeFull' | 'dateTimeShort';

/** Formata data/hora conforme idioma e fuso do perfil UI. */
export function formatUiDateTime(
  lang: string,
  value: Date | string | number | null | undefined,
  style: UiDateFormatStyle = 'date'
): string {
  if (value == null || value === '') return '-';
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) {
    return typeof value === 'string' ? value : '-';
  }
  const { intlLocale, timeZone } = getLocaleProfile(lang);
  switch (style) {
    case 'date':
      return d.toLocaleDateString(intlLocale, {
        timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
      });
    case 'dateTimeShort':
      return d.toLocaleString(intlLocale, {
        timeZone,
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    case 'dateTimeFull':
      return d.toLocaleString(intlLocale, {
        timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });
    default:
      return d.toLocaleString(intlLocale, {
        timeZone,
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
  }
}
