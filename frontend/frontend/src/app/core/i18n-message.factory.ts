import { MessageService } from 'primeng/api';
import { TranslationService } from './translation.service';
import { defaultToastLife } from './toast-defaults.util';

/**
 * MessageService global com tradução automática de summary/detail em PT
 * via mapa gerado (toast-phrase-map.generated.ts) e chaves i18n segmentadas
 * (ex.: common.toast.success) resolvidas por translateToastPhrase.
 */
export function createI18nMessageService(i18n: TranslationService): MessageService {
  const svc = new MessageService();
  const origAdd = svc.add.bind(svc);
  (svc as unknown as { add: typeof svc.add }).add = (msg) => {
    const next = { ...msg } as typeof msg;
    if (typeof next.summary === 'string') {
      next.summary = i18n.translateToastPhrase(next.summary);
    }
    if (typeof next.detail === 'string') {
      next.detail = i18n.translateToastPhrase(next.detail);
    }
    if (next.life == null || next.life <= 0) {
      next.life = defaultToastLife(next.severity);
    }
    if (next.sticky == null) {
      next.sticky = false;
    }
    return origAdd(next);
  };
  return svc;
}
