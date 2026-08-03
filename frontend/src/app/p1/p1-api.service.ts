import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TranslationService } from '../core/translation.service';

export interface LgpdDocument {
  tipo: string;
  versao: string;
  titulo: string;
  conteudo: string;
}

export interface LgpdAceiteBody {
  aceito: boolean;
  versaoTermos: string;
  versaoPrivacidade: string;
}

export interface BillingStatus {
  tenantId: number;
  planoCodigo: string;
  status: string;
  trialEndsAt?: string;
  provedor: string;
  checkoutAvailable: boolean;
  stripeConfigured?: boolean;
}

export interface LgpdSolicitacaoItem {
  id: number;
  tipo: string;
  status: string;
  downloadAvailable?: boolean;
  errorMessage?: string;
}

@Injectable({ providedIn: 'root' })
export class P1ApiService {
  private readonly http = inject(HttpClient);
  private readonly i18n = inject(TranslationService);

  getTermos(tenantCodigo?: string | null): Observable<LgpdDocument> {
    return this.http.get<LgpdDocument>('/api/public/lgpd/termos', {
      params: this.lgpdTenantParams(tenantCodigo),
      headers: this.localeHeaders(),
    });
  }

  getPrivacidade(tenantCodigo?: string | null): Observable<LgpdDocument> {
    return this.http.get<LgpdDocument>('/api/public/lgpd/privacidade', {
      params: this.lgpdTenantParams(tenantCodigo),
      headers: this.localeHeaders(),
    });
  }

  private localeHeaders(): HttpHeaders {
    return new HttpHeaders({ 'Accept-Language': this.i18n.getCurrentLanguage() });
  }

  private lgpdTenantParams(tenantCodigo?: string | null): HttpParams | undefined {
    const t = tenantCodigo?.trim();
    return t ? new HttpParams().set('tenant', t) : undefined;
  }

  registrarAceite(body: LgpdAceiteBody): Observable<void> {
    return this.http.post<void>('/api/lgpd/aceite', body);
  }

  solicitarLgpd(tipo: 'EXPORT' | 'DELETE'): Observable<unknown> {
    return this.http.post('/api/lgpd/solicitacoes', { tipo });
  }

  listarSolicitacoes(): Observable<LgpdSolicitacaoItem[]> {
    return this.http.get<LgpdSolicitacaoItem[]>('/api/lgpd/solicitacoes');
  }

  downloadExport(id: number): void {
    this.http.get(`/api/lgpd/solicitacoes/${id}/download`, { responseType: 'blob' }).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `lgpd-export-${id}.json`;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  billingStatus(): Observable<BillingStatus> {
    return this.http.get<BillingStatus>('/api/billing/status');
  }

  billingCheckout(): Observable<{ checkoutUrl: string }> {
    return this.http.post<{ checkoutUrl: string }>('/api/billing/checkout-session', {});
  }

  billingMockActivate(): Observable<BillingStatus> {
    return this.http.post<BillingStatus>('/api/billing/mock/activate', {});
  }

  signupTrial(body: unknown): Observable<unknown> {
    return this.http.post('/api/public/signup/trial', body);
  }
}
