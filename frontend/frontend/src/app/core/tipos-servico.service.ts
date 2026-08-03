import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';

export interface Page<T> { items: T[]; totalElements: number; totalPages: number; page: number; size: number; sort?: string; }

export interface TipoServico { id?: number; [key: string]: any; }

@Injectable({ providedIn: 'root' })
export class TipoServicoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tipos-servico`;
  list(params: any = {}) {
    let hp = new HttpParams();
    // Filtrar apenas registros ativos por padrão
    hp = hp.set('isActive', 'true');
    for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    return this.http.get<Page<TipoServico>>(this.base, { params: hp });
  }
  getById(id: number) { return this.http.get<TipoServico>(`${this.base}/${id}`); }
  update(id: number, body: any) { return this.http.put<TipoServico>(`${this.base}/${id}`, body); }
  delete(id: number) { return this.http.put<TipoServico>(`${this.base}/${id}`, { isActive: false }); }
  create(body: any) { return this.http.post<TipoServico>(this.base, body); }
}
