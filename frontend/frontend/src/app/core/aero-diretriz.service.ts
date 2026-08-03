import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface AeroDiretriz {
  id?: number;
  tipo: string;
  numero: string;
  titulo: string;
  emissor?: string;
  ata?: string;
  fcuId?: number;
  fcuCodigo?: string;
  partNumber?: string;
  serialNumber?: string;
  dataEmissao?: string;
  dataLimiteCumprimento?: string;
  dataCumprimento?: string;
  status: string;
  osCumprimentoId?: number;
  osNumero?: number;
  observacoes?: string;
  severidadeAlerta?: string;
  diasParaLimite?: number;
}

export interface AeroDiretrizPage {
  items: AeroDiretriz[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface AeroDiretrizAlertasResumo {
  diasJanela: number;
  totalVencidas: number;
  totalProximas: number;
  totalAbertas: number;
  itens: AeroDiretriz[];
}

@Injectable({ providedIn: 'root' })
export class AeroDiretrizService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/aero/diretrizes`;

  listar(params: {
    page?: number;
    size?: number;
    q?: string;
    tipo?: string;
    status?: string;
    fcuId?: number;
  }): Observable<AeroDiretrizPage> {
    let p = new HttpParams();
    if (params.page != null) {
      p = p.set('page', String(params.page));
    }
    if (params.size != null) {
      p = p.set('size', String(params.size));
    }
    if (params.q) {
      p = p.set('q', params.q);
    }
    if (params.tipo) {
      p = p.set('tipo', params.tipo);
    }
    if (params.status) {
      p = p.set('status', params.status);
    }
    if (params.fcuId != null) {
      p = p.set('fcuId', String(params.fcuId));
    }
    return this.http.get<AeroDiretrizPage>(this.base, { params: p });
  }

  alertas(dias = 30): Observable<AeroDiretrizAlertasResumo> {
    return this.http.get<AeroDiretrizAlertasResumo>(`${this.base}/alertas`, {
      params: new HttpParams().set('dias', String(dias))
    });
  }

  aplicaveis(fcuId?: number, partNumber?: string, serialNumber?: string): Observable<{ itens: AeroDiretriz[] }> {
    let p = new HttpParams();
    if (fcuId != null) {
      p = p.set('fcuId', String(fcuId));
    }
    if (partNumber) {
      p = p.set('partNumber', partNumber);
    }
    if (serialNumber) {
      p = p.set('serialNumber', serialNumber);
    }
    return this.http.get<{ itens: AeroDiretriz[] }>(`${this.base}/aplicaveis`, { params: p });
  }

  criar(body: Partial<AeroDiretriz>): Observable<AeroDiretriz> {
    return this.http.post<AeroDiretriz>(this.base, body);
  }

  atualizar(id: number, body: Partial<AeroDiretriz>): Observable<AeroDiretriz> {
    return this.http.put<AeroDiretriz>(`${this.base}/${id}`, body);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
