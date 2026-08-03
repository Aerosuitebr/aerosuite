/**
 * Extrai chave i18n de respostas de erro da API (GlobalExceptionMapper, ErrorBody, resources).
 */
export function extractApiErrorKey(errorBody: unknown): string | undefined {
  if (!errorBody || typeof errorBody !== 'object') {
    return undefined;
  }
  const b = errorBody as Record<string, unknown>;
  for (const field of ['code', 'error', 'message']) {
    const v = b[field];
    if (typeof v === 'string' && looksLikeI18nKey(v)) {
      return normalizeApiErrorKey(v.trim());
    }
  }
  return undefined;
}

/** Normaliza prefixos legados do backend para chaves do dicionário frontend. */
export function normalizeApiErrorKey(key: string): string {
  if (key.startsWith('estoque.certificado.')) {
    return key.replace('estoque.certificado.', 'estoque.cert.');
  }
  return key;
}

function looksLikeI18nKey(value: string): boolean {
  if (value.length > 120 || value.includes(' ')) {
    return false;
  }
  return /^[a-z][a-z0-9_]*(\.[a-z0-9_]+)+$/i.test(value);
}
