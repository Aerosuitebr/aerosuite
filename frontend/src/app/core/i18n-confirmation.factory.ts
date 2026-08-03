import { ConfirmationService } from 'primeng/api';
import { TranslationService } from './translation.service';

/**
 * ConfirmationService global: message, header, accept/reject labels e ariaLabels
 * passam por translateToastPhrase (mapa PT + chaves i18n segmentadas).
 */
export function createI18nConfirmationService(i18n: TranslationService): ConfirmationService {
  const svc = new ConfirmationService();
  const origConfirm = svc.confirm.bind(svc);
  const tr = (s: string | undefined) => (typeof s === 'string' ? i18n.translateToastPhrase(s) : s);

  (svc as unknown as { confirm: typeof origConfirm }).confirm = (opt) => {
    if (!opt) {
      return origConfirm(opt);
    }
    const next = { ...opt };
    if (typeof next.message === 'string') {
      next.message = tr(next.message) ?? '';
    }
    if (typeof next.header === 'string') {
      next.header = tr(next.header);
    }
    if (typeof next.rejectLabel === 'string') {
      next.rejectLabel = tr(next.rejectLabel);
    } else if (next.rejectLabel == null) {
      next.rejectLabel = tr('common.confirm.noShort');
    }
    if (typeof next.acceptLabel === 'string') {
      next.acceptLabel = tr(next.acceptLabel);
    } else if (next.acceptLabel == null) {
      next.acceptLabel = tr('common.confirm.yes');
    }
    return origConfirm(next);
  };

  return svc;
}
