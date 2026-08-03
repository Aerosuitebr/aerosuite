import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { HangarOption } from './capacidade-fila.service';

export interface HangarWrite {
  codigo: string;
  nome: string;
  ordem?: number;
  ativo?: boolean;
}

@Injectable({ providedIn: 'root' })
export class HangarCapacidadeService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/hangares`;

  listar(incluirInativos = false): Observable<HangarOption[]> {
    const q = incluirInativos ? '?incluirInativos=true' : '';
    return this.http.get<HangarOption[]>(`${this.base}${q}`);
  }

  criar(body: HangarWrite): Observable<HangarOption> {
    return this.http.post<HangarOption>(this.base, body);
  }

  atualizar(id: number, body: HangarWrite): Observable<HangarOption> {
    return this.http.put<HangarOption>(`${this.base}/${id}`, body);
  }
}
