import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { FcuAssemblyDoc } from '../fcu-assembly/fcu-assembly-types';
import { environment } from '../../environments/environment';

/**
 * Serviço para documentos de montagem FCU (Assembly)
 */
@Injectable({ providedIn: 'root' })
export class FcuAssemblyService {
  private http = inject(HttpClient);
  // Usar URL completa em desenvolvimento para evitar problemas de proxy
  private baseUrl = environment.production
    ? '/api/fcu/assembly'
    : `${environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl}/fcu/assembly`;

  /** Lista todos os documentos de montagem FCU ativos */
  list(params?: any): Observable<FcuAssemblyDoc[]> {
    const mergedParams = { ...params, isActive: 'true' };
    return this.http.get<FcuAssemblyDoc[]>(this.baseUrl, { params: mergedParams });
  }

  /** Cria novo documento de montagem */
  create(fcu: FcuAssemblyDoc): Observable<any> {
    return this.http.post(this.baseUrl, fcu);
  }

  /** Atualiza documento de montagem existente */
  update(id: number, fcu: FcuAssemblyDoc): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, fcu);
  }

  /** Inativa documento de montagem (soft delete) */
  delete(id: number): Observable<any> {
    return this.http.put(`${this.baseUrl}/${id}`, { isActive: false });
  }

  /** Obtém um documento de montagem pelo ID */
  get(id: number): Observable<FcuAssemblyDoc> {
    return this.http.get<FcuAssemblyDoc>(`${this.baseUrl}/${id}`);
  }

  /** Cria ou atualiza um documento de montagem */
  saveAssembly(payload: FcuAssemblyDoc): Observable<any> {
    if ((payload as any).id) {
      return this.http.put(`${this.baseUrl}/${(payload as any).id}`, payload);
    } else {
      return this.http.post(`${this.baseUrl}`, payload);
    }
  }

  /** Importa um documento Word (.docx) e converte para JSON */
  importAssemblyDocx(file: File): Observable<FcuAssemblyDoc> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<FcuAssemblyDoc>(`${this.baseUrl}/import`, formData);
  }

  /** Exporta o documento em PDF */
  exportPdf(id: number): Observable<Blob> {
    return this.http.get(`${this.baseUrl}/${id}/pdf`, { responseType: 'blob' });
  }
}
