import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';

export interface TpFiles {
  id?: number;
  fileName: string;
  originalName: string;
  filePath: string;
  fileSize?: number;
  contentType?: string;
  fileExtension?: string;
  description?: string;
  tipoServicoId?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  isActive?: boolean;
}

export interface Page<T> { 
  items: T[]; 
  totalElements: number; 
  totalPages: number; 
  page: number; 
  size: number; 
  sort?: string; 
}

@Injectable({ providedIn: 'root' })
export class TpFilesService {
  private http = inject(HttpClient);
  private base = '/api/tp-files';

  list(params: any = {}) {
    let hp = new HttpParams();
    // Filtrar apenas registros ativos por padrão
    hp = hp.set('isActive', 'true');
    for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    return this.http.get<Page<TpFiles>>(this.base, { params: hp });
  }

  update(id: number, body: any) { 
    return this.http.put<TpFiles>(`${this.base}/${id}`, body); 
  }

  delete(id: number) { 
    return this.http.put<TpFiles>(`${this.base}/${id}`, { isActive: false }); 
  }

  create(body: any) { 
    return this.http.post<TpFiles>(this.base, body); 
  }
}
