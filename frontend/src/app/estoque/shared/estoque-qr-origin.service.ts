import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../../environments/environment';
import { isLoopbackScanOrigin } from './etiqueta-qr.util';

/**
 * Origem (scheme + host + port) para URLs em QR de etiquetas.
 * Em localhost usa a API para obter IP da LAN; em produção usa o host atual ou FRONTEND_URL.
 */
@Injectable({ providedIn: 'root' })
export class EstoqueQrOriginService {
  private http = inject(HttpClient);
  private cached: string | null = null;

  /** Invalida cache (ex.: após mudar de rede). */
  clearCache(): void {
    this.cached = null;
  }

  async resolveOrigin(): Promise<string> {
    const fromBrowser = this.browserOrigin();
    if (fromBrowser && !isLoopbackScanOrigin(fromBrowser)) {
      return fromBrowser;
    }
    if (this.cached) {
      return this.cached;
    }
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const res = await firstValueFrom(
      this.http.get<{ baseUrl: string }>(`${apiUrl}/estoque/qr-scan-base-url`)
    );
    const base = (res?.baseUrl ?? '').trim().replace(/\/$/, '');
    if (base.startsWith('http')) {
      this.cached = base;
      return base;
    }
    return fromBrowser;
  }

  private browserOrigin(): string {
    if (typeof globalThis === 'undefined' || !('location' in globalThis)) {
      return '';
    }
    const origin = (globalThis as { location?: { origin?: string } }).location?.origin ?? '';
    return origin.replace(/\/$/, '');
  }
}
