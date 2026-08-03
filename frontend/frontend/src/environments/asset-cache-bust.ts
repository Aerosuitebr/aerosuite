/**
 * Único lugar a alterar quando trocar branding estático mantendo o **mesmo nome de ficheiro**
 * (`src/assets/**`: logos, bandeiras, etc.) ou quando o wordmark/logo **na API** mudar mas o URL continuar igual.
 *
 * Motivo: em produção o nginx define `Cache-Control: public, immutable` para extensões como `.png` / `.svg`
 * (longa duração). Sem mudar esta string, o URL continua igual e o browser mostra bytes antigos mesmo após rebuild.
 */
export const STATIC_ASSETS_CACHE_BUST = '17';

const CACHE_QS = 'v';

function isPublicEmpresaAssetUrl(raw: string): boolean {
  return raw.toLowerCase().includes('/api/public/empresa-asset/');
}

function withQueryBust(pathPart: string, existingQuery: string): string {
  const params = new URLSearchParams(existingQuery);
  params.set(CACHE_QS, STATIC_ASSETS_CACHE_BUST);
  return `${pathPart}?${params.toString()}`;
}

/**
 * Anexa (ou atualiza) o parâmetro de cache-bust em:
 * - URLs sob `assets/` (relativas, absolutas no site ou `https://.../assets/...`)
 * - URLs públicas de ficheiros da empresa (`.../api/public/empresa-asset/logo|wordmark`) — mesmo problema de cache.
 *
 * Não altera `data:`, `blob:`, nem outras rotas `/api/...`.
 */
export function bustStaticAssetUrl(url: string): string {
  const raw = (url || '').trim();
  if (!raw) return raw;
  if (raw.startsWith('data:') || raw.startsWith('blob:')) return raw;

  if (isPublicEmpresaAssetUrl(raw)) {
    if (/^https?:\/\//i.test(raw)) {
      try {
        const u = new URL(raw);
        u.searchParams.set(CACHE_QS, STATIC_ASSETS_CACHE_BUST);
        return u.toString();
      } catch {
        return raw;
      }
    }
    const q = raw.indexOf('?');
    const pathPart = (q >= 0 ? raw.slice(0, q) : raw).trim();
    const query = q >= 0 ? raw.slice(q + 1) : '';
    return withQueryBust(pathPart, query);
  }

  if (/^\/api\//i.test(raw) || /^api\//i.test(raw)) return raw;

  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (!u.pathname.includes('/assets/')) return raw;
      u.searchParams.set(CACHE_QS, STATIC_ASSETS_CACHE_BUST);
      return u.toString();
    } catch {
      return raw;
    }
  }

  const q = raw.indexOf('?');
  const pathPart = (q >= 0 ? raw.slice(0, q) : raw).trim();
  const query = q >= 0 ? raw.slice(q + 1) : '';
  const norm = pathPart.replace(/^\/+/, '');
  if (!norm.startsWith('assets/')) return raw;

  return withQueryBust(pathPart, query);
}
