import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { TranslationService } from './translation.service';
import { Observable, of, BehaviorSubject } from 'rxjs';
import { map, catchError, finalize, shareReplay } from 'rxjs/operators';

export interface CotacaoDolar {
  cotacaoCompra: number;
  cotacaoVenda: number;
  dataHoraCotacao: string;
  fonte: string;
}

@Injectable({ providedIn: 'root' })
export class CotacaoService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  
  // Cache da cotação do dia
  private _cotacaoAtual = new BehaviorSubject<CotacaoDolar | null>(null);
  cotacaoAtual$ = this._cotacaoAtual.asObservable();
  
  private lastFetch: Date | null = null;
  private cacheTimeout = 30 * 60 * 1000; // 30 minutos de cache
  private inFlight: Observable<CotacaoDolar> | null = null;

  /**
   * Busca a cotação do dólar do dia
   * Usa a API do Banco Central do Brasil (BCB)
   */
  getCotacaoDolar(): Observable<CotacaoDolar> {
    // Verificar se tem cache válido
    if (this._cotacaoAtual.value && this.lastFetch) {
      const now = new Date();
      const diff = now.getTime() - this.lastFetch.getTime();
      if (diff < this.cacheTimeout) {
        return of(this._cotacaoAtual.value);
      }
    }

    // Compartilha a mesma chamada entre componentes que carregam simultaneamente.
    if (this.inFlight) {
      return this.inFlight;
    }

    // Buscar cotação da API do BCB
    // Formato da data para a API: MM-DD-YYYY
    const hoje = new Date();
    const dataFormatada = this.formatarDataBCB(hoje);
    
    // API do Banco Central - Cotações de moedas
    // https://dadosabertos.bcb.gov.br/dataset/dolar-americano-usd-todos-os-boletins-diarios
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataFormatada}'&$format=json`;

    this.inFlight = this.http.get<any>(url).pipe(
      map(response => {
        if (response.value && response.value.length > 0) {
          // Pegar a última cotação do dia (pode haver várias)
          const ultima = response.value[response.value.length - 1];
          const cotacao: CotacaoDolar = {
            cotacaoCompra: ultima.cotacaoCompra,
            cotacaoVenda: ultima.cotacaoVenda,
            dataHoraCotacao: ultima.dataHoraCotacao,
            fonte: this.i18n.translate('comercial.proposta.cotacao.fonte.bcb')
          };
          this._cotacaoAtual.next(cotacao);
          this.lastFetch = new Date();
          return cotacao;
        }
        throw new Error('comercial.proposta.cotacao.unavailable');
      }),
      catchError(error => {
        console.warn('Failed to fetch BCB exchange rate, trying previous day...', error);
        // Se não encontrou para hoje, tentar ontem (fim de semana/feriado)
        return this.getCotacaoDiaAnterior(hoje, 1);
      }),
      finalize(() => (this.inFlight = null)),
      shareReplay({ bufferSize: 1, refCount: false })
    );
    return this.inFlight;
  }

  /**
   * Tenta buscar cotação de dias anteriores (para fins de semana/feriados)
   */
  private getCotacaoDiaAnterior(data: Date, tentativa: number): Observable<CotacaoDolar> {
    if (tentativa > 5) {
      // Após 5 tentativas, retornar cotação padrão
      console.warn('Could not fetch exchange rate, using default value');
      return of({
        cotacaoCompra: 5.00,
        cotacaoVenda: 5.00,
        dataHoraCotacao: new Date().toISOString(),
        fonte: this.i18n.translate('comercial.proposta.cotacao.fonte.fallback')
      });
    }

    const dataAnterior = new Date(data);
    dataAnterior.setDate(dataAnterior.getDate() - tentativa);
    const dataFormatada = this.formatarDataBCB(dataAnterior);
    
    const url = `https://olinda.bcb.gov.br/olinda/servico/PTAX/versao/v1/odata/CotacaoDolarDia(dataCotacao=@dataCotacao)?@dataCotacao='${dataFormatada}'&$format=json`;

    return this.http.get<any>(url).pipe(
      map(response => {
        if (response.value && response.value.length > 0) {
          const ultima = response.value[response.value.length - 1];
          const cotacao: CotacaoDolar = {
            cotacaoCompra: ultima.cotacaoCompra,
            cotacaoVenda: ultima.cotacaoVenda,
            dataHoraCotacao: ultima.dataHoraCotacao,
            fonte: this.i18n.translate('comercial.proposta.cotacao.fonte.bcb')
          };
          this._cotacaoAtual.next(cotacao);
          this.lastFetch = new Date();
          return cotacao;
        }
        throw new Error('comercial.proposta.cotacao.unavailable');
      }),
      catchError(() => this.getCotacaoDiaAnterior(data, tentativa + 1))
    );
  }

  private formatarDataBCB(data: Date): string {
    const mes = String(data.getMonth() + 1).padStart(2, '0');
    const dia = String(data.getDate()).padStart(2, '0');
    const ano = data.getFullYear();
    return `${mes}-${dia}-${ano}`;
  }

  /**
   * Converte valor de BRL para USD
   */
  convertBrlToUsd(valorBrl: number, cotacao: CotacaoDolar): number {
    if (!cotacao || cotacao.cotacaoVenda <= 0) return 0;
    return valorBrl / cotacao.cotacaoVenda;
  }

  /**
   * Converte valor de USD para BRL
   */
  convertUsdToBrl(valorUsd: number, cotacao: CotacaoDolar): number {
    if (!cotacao) return 0;
    return valorUsd * cotacao.cotacaoVenda;
  }

  /**
   * Formata valor em USD
   */
  formatUsd(valor: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(valor);
  }

  /**
   * Formata valor em BRL
   */
  formatBrl(valor: number): string {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(valor);
  }

  /**
   * Limpa o cache forçando nova busca
   */
  clearCache(): void {
    this._cotacaoAtual.next(null);
    this.lastFetch = null;
    this.inFlight = null;
  }
}
