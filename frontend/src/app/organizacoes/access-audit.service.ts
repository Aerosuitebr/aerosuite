import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AccessAuditEntry {
  id: number;
  tenantId?: number | null;
  usuarioId?: number | null;
  email?: string | null;
  evento: string;
  sucesso: boolean;
  detalhe?: string | null;
  ip?: string | null;
  recurso?: string | null;
  createdAt: string;
}

export interface AccessAuditPage {
  items: AccessAuditEntry[];
  total: number;
}

export interface AccessAuditFilters {
  tenantId?: number;
  evento?: string;
  email?: string;
  from?: string;
  to?: string;
  limit?: number;
  offset?: number;
}

@Injectable({ providedIn: 'root' })
export class AccessAuditService {
  private apiBase(): string {
    return environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
  }

  list(filters: AccessAuditFilters = {}): Observable<AccessAuditPage> {
    let params = new HttpParams();
    if (filters.tenantId != null) {
      params = params.set('tenantId', String(filters.tenantId));
    }
    if (filters.evento) {
      params = params.set('evento', filters.evento);
    }
    if (filters.email) {
      params = params.set('email', filters.email);
    }
    if (filters.from) {
      params = params.set('from', filters.from);
    }
    if (filters.to) {
      params = params.set('to', filters.to);
    }
    params = params.set('limit', String(filters.limit ?? 50));
    params = params.set('offset', String(filters.offset ?? 0));
    return this.http.get<AccessAuditPage>(`${this.apiBase()}/platform/access-audit`, { params });
  }

  constructor(private http: HttpClient) {}
}
