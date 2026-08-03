import { TranslationService } from './translation.service';

/** Formata minutos de SLA para exibição (ex.: 30 min, 2 h, 1 d 12 h). */
export function formatSlaDurationMinutes(minutes: number | undefined | null, i18n: TranslationService): string {
  if (minutes == null || minutes <= 0) {
    return '—';
  }
  if (minutes < 60) {
    return i18n.translate('suporte.sla.duration.minutes', { count: String(minutes) });
  }
  if (minutes % 60 === 0) {
    const hours = minutes / 60;
    if (hours >= 24 && hours % 24 === 0) {
      const days = hours / 24;
      return i18n.translate('suporte.sla.duration.days', { count: String(days) });
    }
    return i18n.translate('suporte.sla.duration.hours', { count: String(hours) });
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return i18n.translate('suporte.sla.duration.hoursMinutes', {
    hours: String(hours),
    minutes: String(mins)
  });
}

export function formatSlaPreviewLine(
  primeiraRespostaMinutos: number,
  resolucaoMinutos: number,
  i18n: TranslationService
): string {
  const first = formatSlaDurationMinutes(primeiraRespostaMinutos, i18n);
  const resolution = formatSlaDurationMinutes(resolucaoMinutos, i18n);
  return i18n.translate('suporte.ticketNew.sla.line', { first, resolution });
}

export function slaModifierHintKey(modifier: string | undefined): string {
  switch (modifier) {
    case 'ACCELERATED':
      return 'suporte.ticketNew.sla.modifier.production';
    case 'RELAXED':
      return 'suporte.ticketNew.sla.modifier.development';
    default:
      return 'suporte.ticketNew.sla.modifier.standard';
  }
}

export function slaModifierBadgeClass(modifier: string | undefined): string {
  switch (modifier) {
    case 'ACCELERATED':
      return 'sla-card--accelerated';
    case 'RELAXED':
      return 'sla-card--relaxed';
    default:
      return 'sla-card--standard';
  }
}
