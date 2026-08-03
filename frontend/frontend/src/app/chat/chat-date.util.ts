import { TranslationService } from '../core/translation.service';

export function chatUiLocale(i18n: TranslationService): string {
  return i18n.getCurrentLanguage() || 'pt-BR';
}

/** Data/hora na lista de conversas (hoje → hora; ontem → rótulo; senão dd/mm). */
export function formatChatConversationDate(
  dataStr: string | undefined,
  i18n: TranslationService
): string {
  if (!dataStr) return '';

  const data = new Date(dataStr);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  const locale = chatUiLocale(i18n);

  if (data.toDateString() === hoje.toDateString()) {
    return data.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' });
  }
  if (data.toDateString() === ontem.toDateString()) {
    return i18n.translate('chat.date.yesterday');
  }
  return data.toLocaleDateString(locale, { day: '2-digit', month: '2-digit' });
}

/** Separador de dia no thread de mensagens. */
export function formatChatMessageDaySeparator(dataStr: string, i18n: TranslationService): string {
  const data = new Date(dataStr);
  const hoje = new Date();
  const ontem = new Date(hoje);
  ontem.setDate(ontem.getDate() - 1);
  const locale = chatUiLocale(i18n);

  if (data.toDateString() === hoje.toDateString()) {
    return i18n.translate('chat.date.today');
  }
  if (data.toDateString() === ontem.toDateString()) {
    return i18n.translate('chat.date.yesterday');
  }
  return data.toLocaleDateString(locale, {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  });
}

export function formatChatMessageTime(dataStr: string, i18n: TranslationService): string {
  return new Date(dataStr).toLocaleTimeString(chatUiLocale(i18n), {
    hour: '2-digit',
    minute: '2-digit'
  });
}
