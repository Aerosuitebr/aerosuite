import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SUPPRESS_FORBIDDEN_TOAST } from '../auth/http-context-tokens';

export interface Page<T> { items: T[]; totalElements: number; totalPages: number; page: number; size: number; sort?: string; }

export interface Fabricante { 
  id?: number; 
  nome?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  [key: string]: any; 
}

@Injectable({ providedIn: 'root' })
export class FabricanteService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/fabricantes`;
  list(params: any = {}, opts?: { suppressForbiddenToast?: boolean }) {
    let hp = new HttpParams();
    // Filtrar apenas registros ativos por padrão
    hp = hp.set('isActive', 'true');
    for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    const context = opts?.suppressForbiddenToast ? new HttpContext().set(SUPPRESS_FORBIDDEN_TOAST, true) : undefined;
    return this.http.get<Page<Fabricante>>(this.base, context ? { params: hp, context } : { params: hp });
  }
  getById(id: number) { return this.http.get<Fabricante>(`${this.base}/${id}`); }
  update(id: number, body: any) { return this.http.put<Fabricante>(`${this.base}/${id}`, body); }
  delete(id: number) { 
    const body = { isActive: false };
    return this.http.put<Fabricante>(`${this.base}/${id}`, body); 
  }
  create(body: any) { return this.http.post<Fabricante>(this.base, body); }
}
