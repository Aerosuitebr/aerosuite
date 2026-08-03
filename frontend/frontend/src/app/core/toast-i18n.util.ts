import type { MessageService } from 'primeng/api';
import type { TranslationService } from './translation.service';
import { defaultToastLife, type ToastSeverity } from './toast-defaults.util';

export type { ToastSeverity };

/** Toast via chaves i18n (padrão premium — substitui summary/detail literais). */
export function toastKey(
  messageService: MessageService,
  i18n: TranslationService,
  severity: ToastSeverity,
  summaryKey: string,
  detailKey?: string,
  detailParams?: Record<string, string>,
  life?: number
): void {
  messageService.add({
    severity,
    summary: i18n.translate(summaryKey),
    detail: detailKey != null ? i18n.translate(detailKey, detailParams) : undefined,
    life: life ?? defaultToastLife(severity),
    sticky: false,
  });
}
