import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, BehaviorSubject, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../environments/environment';

export interface CotacaoDolar {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
  fonte: string;
  estimada?: boolean;
  dataCotacaoConsulta?: string;
}

@Injectable({ providedIn: 'root' })
export class CotacaoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/cotacao`;
  
  private _cotacaoAtual = new BehaviorSubject<CotacaoDolar | null>(null);
  cotacaoAtual$ = this._cotacaoAtual.asObservable();
  
  private lastFetch: Date | null = null;
  private cacheTimeout = 15 * 60 * 1000; // 15 min — alinhado ao backend

  /**
   * Cotação PTAX via backend (proxy BCB). Sem fallback silencioso para 5,00.
   */
  getCotacaoDolar(forceRefresh = false): Observable<CotacaoDolar> {
    if (!forceRefresh && this._cotacaoAtual.value && this.lastFetch) {
      const diff = Date.now() - this.lastFetch.getTime();
      if (diff < this.cacheTimeout && !this._cotacaoAtual.value.estimada) {
        return of(this._cotacaoAtual.value);
      }
    }

    const url = forceRefresh ? `${this.base}/dolar?refresh=true` : `${this.base}/dolar`;
    return this.http.get<CotacaoDolar>(url).pipe(
      map(raw => {
        const cotacao: CotacaoDolar = {
          cotacaoCompra: Number(raw.cotacaoCompra),
          cotacaoVenda: Number(raw.cotacaoVenda),
          dataHoraCotacao: raw.dataHoraCotacao,
          fonte: raw.fonte || 'Banco Central do Brasil (PTAX)',
          estimada: !!raw.estimada,
          dataCotacaoConsulta: raw.dataCotacaoConsulta
        };
        if (!cotacao.cotacaoVenda || cotacao.cotacaoVenda <= 0 || cotacao.estimada) {
          throw new Error('Cotação PTAX inválida ou estimada.');
        }
        this._cotacaoAtual.next(cotacao);
        this.lastFetch = new Date();
        return cotacao;
      }),
      catchError(err => {
        console.error('Falha ao obter cotação PTAX:', err);
        return throwError(() => err);
      })
    );
  }

  convertBrlToUsd(valorBrl: number, cotacao: CotacaoDolar): number {
    if (!cotacao || cotacao.cotacaoVenda <= 0) return 0;
    return valorBrl / cotacao.cotacaoVenda;
  }

  convertUsdToBrl(valorUsd: number, cotacao: CotacaoDolar): number {
    if (!cotacao || cotacao.cotacaoVenda <= 0) return 0;
    return valorUsd * cotacao.cotacaoVenda;
  }

  formatUsd(valor: number): string {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(valor);
  }

  formatBrl(valor: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor);
  }

  clearCache(): void {
    this._cotacaoAtual.next(null);
    this.lastFetch = null;
  }
}
