import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface RelatorioChartSlice {
  label: string;
  value: number;
}

export interface RelatorioProdutoRow {
  id: number;
  nome: string;
  fabricante: string;
  status: string;
  data: string;
}

export interface RelatorioResumo {
  produtosPorFabricante: RelatorioChartSlice[];
  osPorMes: RelatorioChartSlice[];
  produtos: RelatorioProdutoRow[];
  totalProdutos: number;
  totalFabricantes: number;
  totalOs: number;
  totalFcu: number;
  tipoRelatorio?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}

export interface RelatorioResumoQuery {
  tipo?: string | null;
  dataInicio?: string | null;
  dataFim?: string | null;
}

@Injectable({ providedIn: 'root' })
export class RelatorioAnalyticsService {
  private http = inject(HttpClient);

  resumo(query: RelatorioResumoQuery = {}): Observable<RelatorioResumo> {
    const base = environment.getApiUrl?.() ?? environment.apiUrl;
    let params = new HttpParams();
    if (query.tipo) params = params.set('tipo', query.tipo);
    if (query.dataInicio) params = params.set('dataInicio', query.dataInicio);
    if (query.dataFim) params = params.set('dataFim', query.dataFim);
    return this.http.get<RelatorioResumo>(`${base}/relatorios/resumo`, { params });
  }
}
