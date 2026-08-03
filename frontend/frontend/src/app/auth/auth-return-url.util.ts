/** Caminho interno seguro para redirecionamento pós-login (evita open redirect). */
export function sanitizeInternalReturnUrl(raw: string | null | undefined, fallback = '/'): string {
  const url = (raw ?? '').trim();
  if (!url) {
    return fallback;
  }
  if (!url.startsWith('/') || url.startsWith('//')) {
    return fallback;
  }
  if (url.includes('://') || url.includes('\\')) {
    return fallback;
  }
  return url;
}
