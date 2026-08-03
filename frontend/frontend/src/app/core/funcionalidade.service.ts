import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface Funcionalidade {
  id: number;
  nome: string;
  descricao?: string;
  codigo: string;
  icone?: string;
  rota?: string;
  ordem?: number;
  secao: string;
  parentId?: number;
  tipo: 'secao' | 'funcionalidade' | 'submenu';
  visivel: boolean;
  corIcone?: string;
  posicao: number;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  perfilIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class FuncionalidadeService {
  // Usar environment.apiUrl para garantir que funcione corretamente
  private apiUrl = `${environment.apiUrl}/funcionalidades`;

  constructor(private http: HttpClient) { }

  listarTodas(): Observable<Funcionalidade[]> {
    return this.http.get<Funcionalidade[]>(this.apiUrl);
  }

  /** Matriz RBAC do tenant (exclui funcionalidades reservadas ao plano de controle). */
  listarParaGestaoRbac(): Observable<Funcionalidade[]> {
    return this.http.get<Funcionalidade[]>(`${this.apiUrl}/gestao-rbac`);
  }
  
  listarPorSecao(secao: string): Observable<Funcionalidade[]> {
    return this.http.get<Funcionalidade[]>(`${this.apiUrl}/secao/${secao}`);
  }
  
  listarParaMenu(): Observable<Funcionalidade[]> {
    return this.http.get<Funcionalidade[]>(`${this.apiUrl}/menu`);
  }

  /** Menu efetivo do utilizador autenticado (perfil + delegações). */
  listarMeuMenu(): Observable<Funcionalidade[]> {
    return this.http.get<Funcionalidade[]>(`${this.apiUrl}/meu-menu`);
  }

  buscarPorId(id: number): Observable<Funcionalidade> {
    return this.http.get<Funcionalidade>(`${this.apiUrl}/${id}`);
  }

  criar(funcionalidade: Partial<Funcionalidade>): Observable<Funcionalidade> {
    return this.http.post<Funcionalidade>(this.apiUrl, funcionalidade);
  }

  atualizar(id: number, funcionalidade: Partial<Funcionalidade>): Observable<Funcionalidade> {
    return this.http.put<Funcionalidade>(`${this.apiUrl}/${id}`, funcionalidade);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  listarPorPerfil(perfilId: number): Observable<Funcionalidade[]> {
    return this.http.get<Funcionalidade[]>(`${this.apiUrl}/perfil/${perfilId}`);
  }

  listarPorUsuario(usuarioId: number): Observable<Funcionalidade[]> {
    return this.http.get<Funcionalidade[]>(`${this.apiUrl}/usuario/${usuarioId}`);
  }
}
