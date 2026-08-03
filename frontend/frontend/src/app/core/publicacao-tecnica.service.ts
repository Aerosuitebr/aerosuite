import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Fcu } from './fcu.service';

export interface PublicacaoTecnica {
  id?: number;
  fabricanteId?: number;
  ataManual?: string;
  dataRevisaoManual?: string;
  numeroRevisao?: string;
  tipoManual?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  fabricanteNome?: string;
}

export interface PublicacaoFcu {
  id?: number;
  publicacaoId?: number;
  fcuId?: number;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
  // Campos da Publicação
  publicacaoAtaManual?: string;
  publicacaoNumeroRevisao?: string;
  publicacaoTipoManual?: string;
  fabricanteNome?: string;
  // Campos do FCU (Produto Aeronáutico)
  fcuCodigo?: string;
  fcuDescription?: string;
  fcuModelo?: string;
  fcuPn?: string;
  fcuSerialNumber?: string;
  fcuAtaManual?: string;
  fcuDataRevManual?: string;
  fcuNumRevisao?: string;
  fcuIsActive?: boolean;
  // Campo auxiliar para seleção
  selected?: boolean;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class PublicacaoTecnicaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/publicacoes-tecnicas`;
  private associacaoUrl = `${environment.apiUrl}/publicacao-fcu`;

  // ============================================
  // Publicação Técnica CRUD
  // ============================================

  search(params?: {
    page?: number;
    size?: number;
    sort?: string;
    q?: string;
    fabricanteId?: number;
    isActive?: boolean;
  }): Observable<SearchResult<PublicacaoTecnica>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.q) httpParams = httpParams.set('q', params.q);
      if (params.fabricanteId !== undefined) httpParams = httpParams.set('fabricanteId', params.fabricanteId.toString());
      if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    return this.http.get<SearchResult<PublicacaoTecnica>>(this.baseUrl, { params: httpParams });
  }

  findAll(): Observable<PublicacaoTecnica[]> {
    return this.http.get<PublicacaoTecnica[]>(`${this.baseUrl}/all`);
  }

  findById(id: number): Observable<PublicacaoTecnica> {
    return this.http.get<PublicacaoTecnica>(`${this.baseUrl}/${id}`);
  }

  create(publicacao: PublicacaoTecnica): Observable<PublicacaoTecnica> {
    return this.http.post<PublicacaoTecnica>(this.baseUrl, publicacao);
  }

  update(id: number, publicacao: PublicacaoTecnica): Observable<PublicacaoTecnica> {
    return this.http.put<PublicacaoTecnica>(`${this.baseUrl}/${id}`, publicacao);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }

  // ============================================
  // Associação Publicação x FCU (Produto Aeronáutico)
  // ============================================

  searchAssociacoes(params?: {
    page?: number;
    size?: number;
    sort?: string;
    q?: string;
    publicacaoId?: number;
    isActive?: boolean;
  }): Observable<SearchResult<PublicacaoFcu>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.q) httpParams = httpParams.set('q', params.q);
      if (params.publicacaoId !== undefined) httpParams = httpParams.set('publicacaoId', params.publicacaoId.toString());
      if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    return this.http.get<SearchResult<PublicacaoFcu>>(this.associacaoUrl, { params: httpParams });
  }

  getByPublicacaoId(publicacaoId: number): Observable<PublicacaoFcu[]> {
    return this.http.get<PublicacaoFcu[]>(`${this.associacaoUrl}/publicacao/${publicacaoId}`);
  }

  /**
   * Busca a publicação técnica associada a um FCU específico
   * Retorna os dados da publicação para preenchimento automático na OS
   */
  getPublicacaoByFcuId(fcuId: number): Observable<PublicacaoFcu | null> {
    return this.http.get<PublicacaoFcu | null>(`${this.associacaoUrl}/fcu/${fcuId}`);
  }

  getAvailableFcus(publicacaoId: number, search?: string): Observable<Fcu[]> {
    let httpParams = new HttpParams().set('publicacaoId', publicacaoId.toString());
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    return this.http.get<Fcu[]>(`${this.associacaoUrl}/available-fcus`, { params: httpParams });
  }

  getAvailablePublicacoes(fcuId: number, search?: string): Observable<PublicacaoTecnica[]> {
    let httpParams = new HttpParams().set('fcuId', fcuId.toString());
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    return this.http.get<PublicacaoTecnica[]>(`${this.associacaoUrl}/available-publicacoes`, { params: httpParams });
  }

  createAssociacao(associacao: PublicacaoFcu): Observable<PublicacaoFcu> {
    return this.http.post<PublicacaoFcu>(this.associacaoUrl, associacao);
  }

  deleteAssociacao(id: number): Observable<PublicacaoFcu> {
    return this.http.delete<PublicacaoFcu>(`${this.associacaoUrl}/${id}`);
  }

  deleteByPublicacaoAndFcu(publicacaoId: number, fcuId: number): Observable<void> {
    return this.http.delete<void>(`${this.associacaoUrl}/publicacao/${publicacaoId}/fcu/${fcuId}`);
  }

  associateFcus(publicacaoId: number, fcuIds: number[]): Observable<void> {
    let httpParams = new HttpParams().set('publicacaoId', publicacaoId.toString());
    return this.http.post<void>(`${this.associacaoUrl}/associate`, fcuIds, { params: httpParams });
  }
}
