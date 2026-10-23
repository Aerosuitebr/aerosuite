import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PropostaCcoEmail {
  id?: number;
  email: string;
  usuarioId?: number;
  usuarioNome?: string;
  perfilNome?: string;
  perfilCodigo?: string;
}

@Injectable({ providedIn: 'root' })
export class PropostaCcoEmailService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/proposta-cco-emails`;

  listar(): Observable<PropostaCcoEmail[]> {
    return this.http.get<PropostaCcoEmail[]>(this.base);
  }

  disponiveis(): Observable<PropostaCcoEmail[]> {
    return this.http.get<PropostaCcoEmail[]>(`${this.base}/disponiveis`);
  }

  adicionar(body: PropostaCcoEmail): Observable<PropostaCcoEmail> {
    return this.http.post<PropostaCcoEmail>(this.base, body);
  }

  remover(id: number) {
    return this.http.delete(`${this.base}/${id}`);
  }
}
