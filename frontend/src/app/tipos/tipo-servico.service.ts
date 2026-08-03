import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { DEFAULT_LIST_PAGE_SIZE } from '../core/list-pagination.constants';
export interface Page<T> { items:T[]; totalElements:number; totalPages:number; page:number; size:number; sort?:string; }
export interface TipoServico { id?: number; nome?: string; }
@Injectable({ providedIn:'root' })
export class TipoServicoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/tipo_servicos`;
  list(page=0, size=DEFAULT_LIST_PAGE_SIZE, sort='id,asc', q='') {
    let p = new HttpParams().set('page',page).set('size',size).set('sort',sort).set('isActive','true');
    if(q) p = p.set('q', q);
    return this.http.get<Page<TipoServico>>(this.base, { params: p });
  }
  update(id:number, x:TipoServico){ return this.http.put<TipoServico>(`${this.base}/${id}`, x); }
  delete(id:number){ return this.http.put<TipoServico>(`${this.base}/${id}`, { isActive: false }); }
  create(x:TipoServico){ return this.http.post<TipoServico>(this.base, x); }
}
