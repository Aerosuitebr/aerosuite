import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface DelegacaoFuncionalidade {
  id: number;
  usuarioGranteeId: number;
  funcionalidadeCodigo: string;
  concedidoPorUsuarioId?: number | null;
  dataInicio?: string | null;
  dataFim?: string | null;
  ativo?: boolean;
  observacao?: string | null;
}

export interface CriarDelegacaoPayload {
  usuarioGranteeId: number;
  funcionalidadeCodigo: string;
  dataFim?: string | null;
  observacao?: string | null;
}

@Injectable({ providedIn: 'root' })
export class DelegacaoFuncionalidadeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/delegacao-funcionalidades`;

  listarPorUsuario(usuarioGranteeId: number): Observable<DelegacaoFuncionalidade[]> {
    const params = new HttpParams().set('usuarioGranteeId', String(usuarioGranteeId));
    return this.http.get<DelegacaoFuncionalidade[]>(this.base, { params });
  }

  criar(body: CriarDelegacaoPayload): Observable<DelegacaoFuncionalidade> {
    return this.http.post<DelegacaoFuncionalidade>(this.base, body);
  }

  revogar(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
