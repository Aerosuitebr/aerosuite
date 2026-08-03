import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface ArquivoBiblioteca {
  nome: string;
  path: string;
}

/** Item de categoria (pasta) retornado por /children - um nível por vez */
export interface CategoriaItemBiblioteca {
  nome: string;
  path: string;
}

/** Resposta de GET /biblioteca/children - filhos diretos de um path */
export interface ChildrenBiblioteca {
  categorias: CategoriaItemBiblioteca[];
  arquivos: ArquivoBiblioteca[];
}

@Injectable({ providedIn: 'root' })
export class BibliotecaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/biblioteca`;
  private cache = new Map<string, ChildrenBiblioteca>();

  getInfo(): Observable<{ path: string; exists: boolean; isDirectory: boolean }> {
    return this.http.get<{ path: string; exists: boolean; isDirectory: boolean }>(`${this.base}/info`);
  }

  /**
   * Retorna apenas os filhos diretos (um nível). path vazio = raiz.
   * Resultado é cacheado para não refazer a mesma requisição.
   */
  getChildren(path: string): Observable<ChildrenBiblioteca> {
    const key = path || '';
    const cached = this.cache.get(key);
    if (cached) return of(cached);
    const url = `${this.base}/children?path=${encodeURIComponent(path)}`;
    return this.http.get<ChildrenBiblioteca>(url).pipe(
      tap((res) => this.cache.set(key, res))
    );
  }

  /**
   * Busca o conteúdo do arquivo com autenticação (token) e retorna como Blob
   * para exibição inline no dialog, sem acionar download.
   */
  getConteudoBlob(path: string): Observable<Blob> {
    const url = `${this.base}/conteudo?path=${encodeURIComponent(path)}`;
    return this.http.get(url, { responseType: 'blob' });
  }

  getContentType(fileName: string): 'pdf' | 'image' | 'text' | 'other' {
    const ext = (fileName.split('.').pop() || '').toLowerCase();
    if (ext === 'pdf') return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['txt', 'html', 'htm', 'json', 'xml'].includes(ext)) return 'text';
    return 'other';
  }
}
