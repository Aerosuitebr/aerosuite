// Produção: Sempre usar caminho relativo /api (nginx faz proxy)
// Funciona com HTTPS e Cloudflare
export function getDynamicApiUrl(): string {
  // Em produção, sempre usar caminho relativo
  // O nginx faz proxy de /api para o backend
  return '/api';
}

export const environment = {
  production: true,
  apiUrl: '/api',
  getApiUrl: getDynamicApiUrl,
};
