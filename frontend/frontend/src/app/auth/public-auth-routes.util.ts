/** Rotas públicas da SPA — 401 não deve expulsar o utilizador para /login. */
const PUBLIC_APP_ROUTE_PREFIXES = [
  '/login',
  '/forgot-password',
  '/reset-password',
  '/setup-password',
  '/cadastro-trial',
  '/onboarding',
  '/termos',
  '/privacidade',
  '/change-password-first-login',
  '/mfa-setup',
  '/plataforma/acesso',
  '/plataforma',
  '/rastreio',
  '/externo/login',
  '/externo/forgot-password',
  '/externo/reset-password',
  '/externo/setup-password',
  '/externo/change-password',
] as const;

export function isPublicAppRoute(urlOrPath: string): boolean {
  const path = normalizeAppPath(urlOrPath);
  return PUBLIC_APP_ROUTE_PREFIXES.some(
    (prefix) => path === prefix || path.startsWith(`${prefix}/`)
  );
}

function normalizeAppPath(urlOrPath: string): string {
  const raw = urlOrPath.split('?')[0].split('#')[0].trim() || '/';
  if (raw.length > 1 && raw.endsWith('/')) {
    return raw.slice(0, -1);
  }
  return raw;
}

/** Rotas da API do plano de controle — 401 não deve derrubar a sessão interna da aplicação. */
export function isPlatformOpsAuthApiRequest(url: string): boolean {
  return (
    url.includes('/api/platform-ops/login') ||
    url.includes('/api/platform-ops/elevate') ||
    url.includes('/api/platform-ops/revalidate-mfa') ||
    url.includes('/api/platform-ops/mfa/')
  );
}

/** Endpoints em que 401 é esperado ou a rota pública não deve redirecionar para login. */
export function isPublicApiRequest(url: string): boolean {
  return (
    url.includes('/api/public/health') ||
    url.includes('/api/auth/login') ||
    url.includes('/api/platform-ops/login') ||
    url.includes('/api/auth/login-tenants') ||
    url.includes('/api/auth/forgot-password') ||
    url.includes('/api/auth/validate-reset-token/') ||
    url.includes('/api/auth/reset-password') ||
    url.includes('/api/auth/change-password-new-user') ||
    url.includes('/api/auth-externo/login') ||
    url.includes('/api/auth-externo/login-tenants') ||
    url.includes('/api/auth-externo/forgot-password') ||
    url.includes('/api/auth-externo/reset-password') ||
    url.includes('/api/auth-externo/change-password-new-user') ||
    url.includes('/api/public/')
  );
}

/** Só anexar Bearer / headers internos em chamadas à API Aero Suite (não ViaCEP etc.). */
export function isInternalApiRequest(url: string): boolean {
  if (url.startsWith('/api/')) {
    return true;
  }
  if (url.startsWith('http://') || url.startsWith('https://')) {
    try {
      const origin = typeof window !== 'undefined' ? window.location.origin : '';
      if (origin && url.startsWith(origin)) {
        const path = url.slice(origin.length).split('?')[0];
        return path.startsWith('/api/');
      }
    } catch {
      return false;
    }
    return false;
  }
  return false;
}

/** Evita GET /auth/me na abertura de páginas públicas (token legado no browser). */
export function shouldSkipSessionHydrateOnStartup(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  return isPublicAppRoute(window.location.pathname);
}
