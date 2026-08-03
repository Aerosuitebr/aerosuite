import type { TranslationService } from './translation.service';

const I18N_PREFIX = 'i18n:';

const API_FIELD_LABEL_KEYS: Record<string, string> = {
  description: 'products.new.form.label.description',
  name: 'products.new.form.label.name',
  productpn: 'products.new.form.label.code',
  nome: 'formsMisc.fabricante.labelNovoNome',
};

function localizeApiFieldParams(
  i18n: TranslationService,
  key: string,
  params: Record<string, string>
): Record<string, string> {
  if (key !== 'api.common.fieldTooLong' || !params.field) {
    return params;
  }
  const labelKey = API_FIELD_LABEL_KEYS[params.field];
  if (!labelKey) {
    return params;
  }
  const label = i18n.translate(labelKey);
  return { ...params, field: label !== labelKey ? label : params.field };
}

/** Traduz mensagens codificadas pelo backend (`i18n:chave:param=valor`). */
/** Chave i18n sem prefixo (ex.: api.ticket.notFound, estoque.error.foo). */
function looksLikeI18nKey(message: string): boolean {
  return /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/.test(message);
}

export function translateBackendI18nMessage(
  i18n: TranslationService,
  message: string | null | undefined
): string {
  if (!message) {
    return '';
  }
  if (!message.startsWith(I18N_PREFIX)) {
    if (looksLikeI18nKey(message)) {
      const translated = i18n.translate(message);
      return translated !== message ? translated : message;
    }
    return message;
  }
  const rest = message.slice(I18N_PREFIX.length);
  const segments = rest.split(':');
  const key = segments[0] ?? '';
  const params: Record<string, string> = {};
  for (let i = 1; i < segments.length; i++) {
    const eq = segments[i].indexOf('=');
    if (eq > 0) {
      const paramKey = segments[i].slice(0, eq);
      const raw = segments[i].slice(eq + 1);
      try {
        params[paramKey] = decodeURIComponent(raw);
      } catch {
        params[paramKey] = raw;
      }
    }
  }
  const translated = i18n.translate(key, localizeApiFieldParams(i18n, key, params));
  return translated !== key ? translated : message;
}

export function isBackendI18nMessage(message: string | null | undefined): boolean {
  return !!message?.startsWith(I18N_PREFIX);
}

export const BACKEND_CANCELLED_BY_USER_KEY = 'config.update.backend.cancelledByUser';

/** Detecta cancelamento pelo usuário (chave i18n ou mensagens legadas no banco). */
/** Traduz mensagem da API (`i18n:chave`) ou devolve fallback localizado. */
export function translateApiMessage(
  i18n: TranslationService,
  message: string | null | undefined,
  fallbackKey?: string
): string {
  if (message) {
    return translateBackendI18nMessage(i18n, message);
  }
  return fallbackKey ? i18n.translate(fallbackKey) : '';
}

/** Extrai e traduz `error.error.message` (ou equivalente) de respostas HTTP. */
export function extractApiErrorMessage(
  err: unknown,
  i18n: TranslationService,
  fallbackKey?: string
): string {
  const e = err as {
    error?: { message?: string; error?: string } | string;
    message?: string;
    status?: number;
  };
  const raw =
    typeof e?.error === 'string'
      ? e.error
      : e?.error?.message ?? e?.error?.error ?? e?.message;
  if (typeof raw === 'string' && isBackendI18nMessage(raw)) {
    return translateBackendI18nMessage(i18n, raw);
  }
  const translated = translateApiMessage(i18n, raw, fallbackKey);
  const sanitized = sanitizeUserFacingApiError(translated, e?.status);
  if (sanitized) {
    return sanitized;
  }
  return fallbackKey ? i18n.translate(fallbackKey) : i18n.translate('login.error.serverError');
}

/** Oculta URLs internas, códigos HTTP crus e vazamento SQL/JDBC na UI. */
export function sanitizeUserFacingApiError(message: string, httpStatus?: number): string {
  if (!message) {
    return message;
  }
  const lower = message.toLowerCase();
  if (
    lower.includes('could not execute') ||
    lower.includes('data truncation') ||
    lower.includes('http failure response') ||
    lower.includes('/api/') ||
    lower.includes('502 ok') ||
    lower.includes('bad gateway') ||
    lower.includes('org.hibernate') ||
    lower.includes('jdbc') ||
    lower.includes('sql')
  ) {
    return '';
  }
  if (httpStatus === 502 || httpStatus === 503 || httpStatus === 504) {
    return '';
  }
  return message;
}

export function isCancelledByUserBackendMessage(message: string | null | undefined): boolean {
  if (!message) {
    return false;
  }
  if (message.includes('cancelledByUser')) {
    return true;
  }
  if (isBackendI18nMessage(message)) {
    const key = message.slice(I18N_PREFIX.length).split(':')[0] ?? '';
    return key === BACKEND_CANCELLED_BY_USER_KEY;
  }
  const lower = message.toLowerCase();
  return lower.includes('cancelada pelo usu') || lower.includes('cancelled by user');
}
