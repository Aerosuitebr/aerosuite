import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { Funcionalidade } from './funcionalidade.service';

export interface Perfil {
  id: number;
  nome: string;
  descricao?: string;
  codigo: string;
  ativo: boolean;
  createdAt: string;
  updatedAt: string;
  funcionalidadeIds?: number[];
}

@Injectable({
  providedIn: 'root'
})
export class PerfilService {
  private apiUrl = `${environment.apiUrl}/perfis`;

  constructor(private http: HttpClient) { }

  listarTodos(): Observable<Perfil[]> {
    return this.http.get<Perfil[]>(this.apiUrl);
  }

  buscarPorId(id: number): Observable<Perfil> {
    return this.http.get<Perfil>(`${this.apiUrl}/${id}`);
  }

  criar(perfil: Partial<Perfil>): Observable<Perfil> {
    return this.http.post<Perfil>(this.apiUrl, perfil);
  }

  atualizar(id: number, perfil: Partial<Perfil>): Observable<Perfil> {
    return this.http.put<Perfil>(`${this.apiUrl}/${id}`, perfil);
  }

  deletar(id: number): Observable<any> {
    return this.http.delete<any>(`${this.apiUrl}/${id}`);
  }

  atribuirFuncionalidades(perfilId: number, funcionalidadeIds: number[]): Observable<void> {
    return this.http.post<void>(`${this.apiUrl}/${perfilId}/funcionalidades`, funcionalidadeIds);
  }

  listarFuncionalidades(perfilId: number): Observable<Funcionalidade[]> {
    return this.http.get<Funcionalidade[]>(`${this.apiUrl}/${perfilId}/funcionalidades`);
  }
}
