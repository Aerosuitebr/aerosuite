
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { SUPPRESS_FORBIDDEN_TOAST } from '../auth/http-context-tokens';

export interface Product {
  id?: number;
  description?: string;
  invoice?: number;
  name: string;
  price?: number;
  productpn?: string;
  quantity?: number;
  status?: string;
  local?: string;
  photoUrl?: string;
  idFabricante?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  isActive?: boolean;
  fabricanteNome?: string;
}
export interface Page<T> { items: T[]; totalElements: number; totalPages: number; page: number; size: number; sort?: string; }

@Injectable({ providedIn: 'root' })
export class ProductService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/products`;
  list(params: any = {}, opts?: { suppressForbiddenToast?: boolean }) {
    let hp = new HttpParams();
    const activeFilter = params.isActive ?? 'true';
    hp = hp.set('isActive', String(activeFilter));
    const { isActive: _ignored, ...rest } = params;
    for (const [k, v] of Object.entries(rest)) {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    }
    const context = opts?.suppressForbiddenToast ? new HttpContext().set(SUPPRESS_FORBIDDEN_TOAST, true) : undefined;
    return this.http.get<Page<Product>>(this.base, context ? { params: hp, context } : { params: hp });
  }
  getById(id: number) { return this.http.get<Product>(`${this.base}/${id}`); }
  update(id: number, body: any) { return this.http.put<Product>(`${this.base}/${id}`, body); }
  delete(id: number) { return this.http.put<Product>(`${this.base}/${id}`, { isActive: false }); }
  create(body: any) { return this.http.post<Product>(this.base, body); }
  uploadPhoto(productId: number, files: File[]) {
    const formData = new FormData();
    const maxFiles = Math.min(files.length, 5);
    for (let i = 0; i < maxFiles; i++) {
      const file = files[i];
      if (file) {
        formData.append('file', file, file.name ?? `foto-${i + 1}.jpg`);
      }
    }
    return this.http.post(`${this.base}/${productId}/photo`, formData);
  }
  getPhoto(productId: number) {
    return this.http.get(`${this.base}/${productId}/photo`, { responseType: 'blob' });
  }
}
