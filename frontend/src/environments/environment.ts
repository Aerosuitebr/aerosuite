/**
 * Desenvolvimento (`ng serve`):
 * Use sempre base `/api` (igual à produção). O `proxy.conf.json` encaminha `/api` e `/auth`
 * para o Quarkus — porta definida no proxy (por defeito `http://localhost:8080`).
 *
 * Não use `http://localhost:<porta-do-ng-serve>/api` como URL absoluta: com `--port 8081`
 * isso fazia pedidos ao próprio dev server e gerava 502 (Bad Gateway) e página em branco.
 */
export function getDynamicApiUrl(): string {
  return '/api';
}

export const environment = {
  production: false,
  apiUrl: '/api',
  getApiUrl: getDynamicApiUrl,
};
