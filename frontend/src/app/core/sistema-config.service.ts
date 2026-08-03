import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SistemaConfigPayload {
  valores: Record<string, string | number | boolean>;
  avancadas: {
    logsDetalhados: boolean;
    backupAutomatico: boolean;
    notificacoesEmail: boolean;
  };
  updatedAt?: string;
}

export interface SistemaConfigWriteBody {
  valores?: Record<string, string | number | boolean>;
  avancadas?: Partial<SistemaConfigPayload['avancadas']>;
  restaurarPadroes?: boolean;
}

@Injectable({ providedIn: 'root' })
export class SistemaConfigService {
  private http = inject(HttpClient);

  private base(): string {
    return `${environment.getApiUrl?.() ?? environment.apiUrl}/sistema-config`;
  }

  get(): Observable<SistemaConfigPayload> {
    return this.http.get<SistemaConfigPayload>(this.base());
  }

  save(body: SistemaConfigWriteBody): Observable<SistemaConfigPayload> {
    return this.http.put<SistemaConfigPayload>(this.base(), body);
  }

  restaurarPadroes(): Observable<SistemaConfigPayload> {
    return this.http.put<SistemaConfigPayload>(this.base(), { restaurarPadroes: true });
  }
}
