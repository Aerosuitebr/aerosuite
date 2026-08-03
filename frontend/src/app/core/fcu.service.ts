import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Page } from './product.service';

/**
 * Interface para FCU simples
 */
export interface Fcu {
  id?: number;
  fcuCodigo?: string;
  fcuDescription?: string;
  idProduct?: number;
  idFabricante?: number;
  modelo?: string;
  pn?: string;
  serialNumber?: string;
  ataManual?: string;
  dataRevManual?: string;
  numRevisao?: string;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
  isActive?: boolean;
}

/**
 * Serviço principal de integração com o backend do módulo FCU.
 * Responsável por operações de listagem, criação, atualização e exclusão de FCUs.
 */
@Injectable({ providedIn: 'root' })
export class FcuService {
  protected http = inject(HttpClient);
  protected baseUrl = `${environment.apiUrl}/fcu`;

  /** Lista todos os FCUs ativos */
  list(params: any = {}): Observable<Page<Fcu>> {
    let hp = new HttpParams();
    // Filtrar apenas registros ativos por padrão
    hp = hp.set('isActive', 'true');
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    }
    return this.http.get<Page<Fcu>>(this.baseUrl, { params: hp });
  }

  /** Cria novo FCU */
  create(fcu: Fcu): Observable<Fcu> {
    return this.http.post<Fcu>(this.baseUrl, fcu);
  }

  /** Atualiza FCU existente */
  update(id: number, fcu: Fcu): Observable<Fcu> {
    return this.http.put<Fcu>(`${this.baseUrl}/${id}`, fcu);
  }

  /** Inativa FCU (soft delete) */
  delete(id: number): Observable<Fcu> {
    return this.http.put<Fcu>(`${this.baseUrl}/${id}`, { isActive: false });
  }

  /** Obtém um FCU pelo ID */
  get(id: number): Observable<Fcu> {
    return this.http.get<Fcu>(`${this.baseUrl}/${id}`);
  }
}

// ==========================================================
// 🔧 Compatibilidade com telas antigas de FCU e OS
// ==========================================================

/**
 * Classe de compatibilidade para manter as telas antigas funcionando.
 * Mantém métodos herdados de FcuService com assinaturas esperadas.
 */
@Injectable({ providedIn: 'root' })
export class FcuCompatService extends FcuService {
  /** Lista FCUs simulando estrutura { items, totalElements } */
  override list(params?: any): Observable<any> {
    return new Observable((observer) => {
      // Adicionar parâmetros de paginação padrão se não fornecidos
      const paginationParams = {
        page: 0,
        size: 1000,
        sort: 'id,asc',
        ...params
      };
      
      this.http.get<any>(this.baseUrl, { params: paginationParams }).subscribe({
        next: (data) => {
          // O backend já retorna { items, totalElements, totalPages, page, size, sort }
          observer.next(data);
          observer.complete();
        },
        error: (err) => observer.error(err)
      });
    });
  }
}
