import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Fcu } from './fcu.service';
import { Product } from './product.service';

export interface AssociacaoFcu {
  id?: number;
  idFcu?: number;
  idProduct?: number;
  qtdProduct?: number;
  selected?: boolean;
  
  // Campos do FCU para exibição
  fcuCodigo?: string;
  fcuDescription?: string;
  fcuModelo?: string;
  fcuPn?: string;
  fcuSerialNumber?: string;
  
  // Campos do Product para exibição
  productName?: string;
  productDescription?: string;
  productPn?: string;
  productPrice?: number;
  productQuantity?: number;
  productStatus?: string;
  productLocal?: string;
}

export interface Page<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
  sort?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssociacaoFcuService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/associacao-fcu`;

  // Buscar associações ativas
  search(params: any = {}): Observable<Page<AssociacaoFcu>> {
    let httpParams = new HttpParams();
    // Filtrar apenas registros ativos por padrão
    httpParams = httpParams.set('isActive', 'true');
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined && value !== null && value !== '') {
        httpParams = httpParams.set(key, String(value));
      }
    }
    return this.http.get<Page<AssociacaoFcu>>(this.baseUrl, { params: httpParams });
  }

  getByFcuId(idFcu: number): Observable<AssociacaoFcu[]> {
    return this.http.get<AssociacaoFcu[]>(`${this.baseUrl}/fcu/${idFcu}`);
  }

  getAvailableProducts(idFcu: number, search: string = ''): Observable<Product[]> {
    let httpParams = new HttpParams().set('idFcu', idFcu.toString());
    if (search) {
      httpParams = httpParams.set('search', search);
    }
    return this.http.get<Product[]>(`${this.baseUrl}/available-products`, { params: httpParams });
  }

  create(body: AssociacaoFcu): Observable<AssociacaoFcu> {
    return this.http.post<AssociacaoFcu>(this.baseUrl, body);
  }

  update(id: number, body: AssociacaoFcu): Observable<AssociacaoFcu> {
    return this.http.put<AssociacaoFcu>(`${this.baseUrl}/${id}`, body);
  }

  delete(id: number): Observable<AssociacaoFcu> {
    return this.http.put<AssociacaoFcu>(`${this.baseUrl}/${id}`, { isActive: false });
  }

  associateProducts(idFcu: number, productIds: number[], defaultQuantity: number): Observable<void> {
    let httpParams = new HttpParams()
      .set('idFcu', idFcu.toString())
      .set('defaultQuantity', defaultQuantity.toString());
    return this.http.post<void>(`${this.baseUrl}/associate`, productIds, { params: httpParams });
  }
}