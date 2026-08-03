import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export type WhatsAppConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'CONNECTING';

export interface TenantWhatsAppConnection {
  platformEnabled: boolean;
  platformConfigured: boolean;
  linked: boolean;
  connected: boolean;
  instanceName?: string;
  status?: WhatsAppConnectionStatus | string;
  connectedAt?: string;
  message?: string;
  canManage: boolean;
}

export interface WhatsAppQrCode {
  instanceName?: string;
  status?: string;
  qrCodeBase64?: string;
  pairingCode?: string;
}

@Injectable({ providedIn: 'root' })
export class WhatsAppApiService {
  private apiBase(): string {
    return environment.apiUrl?.replace(/\/$/, '') ?? '/api';
  }

  constructor(private readonly http: HttpClient) {}

  getStatus(): Observable<TenantWhatsAppConnection> {
    return this.http.get<TenantWhatsAppConnection>(`${this.apiBase()}/integracoes/whatsapp/status`);
  }

  activate(): Observable<TenantWhatsAppConnection> {
    return this.http.post<TenantWhatsAppConnection>(`${this.apiBase()}/integracoes/whatsapp/activate`, {});
  }

  fetchQrCode(): Observable<WhatsAppQrCode> {
    return this.http.get<WhatsAppQrCode>(`${this.apiBase()}/integracoes/whatsapp/qrcode`);
  }

  disconnect(): Observable<void> {
    return this.http.delete<void>(`${this.apiBase()}/integracoes/whatsapp/disconnect`);
  }
}
