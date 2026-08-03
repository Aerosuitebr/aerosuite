import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface ClienteProposta {
  id?: number;
  nome?: string;
  cnpjCpf?: string;
  email?: string;
  telefone?: string;
  contato?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  cep?: string;
  observacao?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: number;
}

export interface SearchResult<T> {
  items: T[];
  total: number;
}

@Injectable({
  providedIn: 'root'
})
export class ClientePropostaService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiUrl}/clientes-proposta`;

  search(params?: {
    page?: number;
    size?: number;
    sort?: string;
    q?: string;
    isActive?: boolean;
  }): Observable<SearchResult<ClienteProposta>> {
    let httpParams = new HttpParams();
    if (params) {
      if (params.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
      if (params.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
      if (params.sort) httpParams = httpParams.set('sort', params.sort);
      if (params.q) httpParams = httpParams.set('q', params.q);
      if (params.isActive !== undefined) httpParams = httpParams.set('isActive', params.isActive.toString());
    }
    return this.http.get<SearchResult<ClienteProposta>>(this.baseUrl, { params: httpParams });
  }

  findAll(): Observable<ClienteProposta[]> {
    return this.http.get<ClienteProposta[]>(`${this.baseUrl}/all`);
  }

  searchByName(nome: string): Observable<ClienteProposta[]> {
    let httpParams = new HttpParams().set('nome', nome);
    return this.http.get<ClienteProposta[]>(`${this.baseUrl}/search-by-name`, { params: httpParams });
  }

  findById(id: number): Observable<ClienteProposta> {
    return this.http.get<ClienteProposta>(`${this.baseUrl}/${id}`);
  }

  findByCnpjCpf(cnpjCpf: string): Observable<ClienteProposta> {
    return this.http.get<ClienteProposta>(`${this.baseUrl}/by-cnpj/${encodeURIComponent(cnpjCpf)}`);
  }

  create(cliente: ClienteProposta): Observable<ClienteProposta> {
    return this.http.post<ClienteProposta>(this.baseUrl, cliente);
  }

  update(id: number, cliente: ClienteProposta): Observable<ClienteProposta> {
    return this.http.put<ClienteProposta>(`${this.baseUrl}/${id}`, cliente);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
