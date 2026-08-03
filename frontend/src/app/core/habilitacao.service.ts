import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface UsuarioHabilitacao {
  id?: number;
  usuarioId: number;
  usuarioNome?: string;
  usuarioEmail?: string;
  tipo: string;
  escopo?: string;
  identificador?: string;
  emissor?: string;
  dataEmissao?: string;
  dataValidade?: string;
  observacoes?: string;
  ativo?: boolean;
  severidadeAlerta?: string;
  diasParaValidade?: number;
}

export interface UsuarioHabilitacaoPage {
  items: UsuarioHabilitacao[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface UsuarioHabilitacaoAlertasResumo {
  diasJanela: number;
  totalVencidas: number;
  totalProximas: number;
  totalAtivas: number;
  itens: UsuarioHabilitacao[];
}

@Injectable({ providedIn: 'root' })
export class HabilitacaoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/conformidade/habilitacoes`;

  listar(params: {
    page?: number;
    size?: number;
    q?: string;
    tipo?: string;
    usuarioId?: number;
    somenteAtivas?: boolean;
  }): Observable<UsuarioHabilitacaoPage> {
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
    if (params.usuarioId != null) {
      p = p.set('usuarioId', String(params.usuarioId));
    }
    if (params.somenteAtivas != null) {
      p = p.set('somenteAtivas', String(params.somenteAtivas));
    }
    return this.http.get<UsuarioHabilitacaoPage>(this.base, { params: p });
  }

  alertas(dias = 60): Observable<UsuarioHabilitacaoAlertasResumo> {
    return this.http.get<UsuarioHabilitacaoAlertasResumo>(`${this.base}/alertas`, {
      params: new HttpParams().set('dias', String(dias))
    });
  }

  porUsuario(usuarioId: number): Observable<UsuarioHabilitacao[]> {
    return this.http.get<UsuarioHabilitacao[]>(`${this.base}/usuario/${usuarioId}`);
  }

  criar(body: Partial<UsuarioHabilitacao>): Observable<UsuarioHabilitacao> {
    return this.http.post<UsuarioHabilitacao>(this.base, body);
  }

  atualizar(id: number, body: Partial<UsuarioHabilitacao>): Observable<UsuarioHabilitacao> {
    return this.http.put<UsuarioHabilitacao>(`${this.base}/${id}`, body);
  }

  excluir(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
