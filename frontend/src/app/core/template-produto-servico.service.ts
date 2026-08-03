import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

/**
 * Interface para Template de Produto/Serviço
 */
export interface TemplateProdutoServico {
  id?: number;
  nomeTemplate?: string;
  descricaoTemplate?: string;
  categoria?: string;

  // Dados do Produto
  produtoNome?: string;
  produtoPn?: string;
  produtoManual?: string;
  produtoValorBase?: number;
  aplicacaoMotor?: string;

  // Dados do Serviço
  idTipoServico?: number;
  tipoServicoNome?: string;
  servicoDescricaoPadrao?: string;

  // Condições Padrão
  prazoEntregaPadrao?: string;
  formaPagamentoPadrao?: string;
  validadeDias?: number;
  condicoesGeraisPadrao?: string;
  observacaoPadrao?: string;

  // Metadados
  ativo?: boolean;
  vezesUtilizado?: number;
  createdAt?: string;
  updatedAt?: string;
  createdBy?: string;
}

export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class TemplateProdutoServicoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/templates-produto-servico`;

  list(params: {
    page?: number;
    size?: number;
    sort?: string;
    q?: string;
    categoria?: string;
    ativo?: boolean;
  } = {}): Observable<Page<TemplateProdutoServico>> {
    let hp = new HttpParams();
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    }
    return this.http.get<Page<TemplateProdutoServico>>(this.base, { params: hp });
  }

  listCategorias(): Observable<string[]> {
    return this.http.get<string[]>(`${this.base}/categorias`);
  }

  getById(id: number): Observable<TemplateProdutoServico> {
    return this.http.get<TemplateProdutoServico>(`${this.base}/${id}`);
  }

  create(body: TemplateProdutoServico): Observable<TemplateProdutoServico> {
    return this.http.post<TemplateProdutoServico>(this.base, body);
  }

  update(id: number, body: TemplateProdutoServico): Observable<TemplateProdutoServico> {
    return this.http.put<TemplateProdutoServico>(`${this.base}/${id}`, body);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  registrarUso(id: number): Observable<void> {
    return this.http.post<void>(`${this.base}/${id}/registrar-uso`, {});
  }
}
