import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslationService } from './translation.service';

export interface RetencaoConfig {
  anosRetencao: number;
  dataLimiteRetencao: string;
  minAnos: number;
  maxAnos: number;
}

export interface RetencaoInventario {
  anosRetencao: number;
  dataLimiteRetencao: string;
  totalOsFechadas: number;
  totalDentroRetencao: number;
  totalForaRetencao: number;
  totalOsAbertas: number;
  amostraForaRetencao: {
    osId: number;
    numeroOs: number;
    clienteNome?: string;
    dataFechamento?: string;
    dtAbertura?: string;
    crsEmitido?: boolean;
  }[];
}

@Injectable({ providedIn: 'root' })
export class ConformidadeRetencaoService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private base = `${environment.apiUrl}/conformidade/retencao`;

  getConfig(): Observable<RetencaoConfig> {
    return this.http.get<RetencaoConfig>(this.base);
  }

  saveConfig(anosRetencao: number): Observable<RetencaoConfig> {
    return this.http.put<RetencaoConfig>(this.base, { anosRetencao });
  }

  inventario(): Observable<RetencaoInventario> {
    return this.http.get<RetencaoInventario>(`${this.base}/inventario`);
  }

  downloadArquivoMorto(params: {
    dataInicio?: string;
    dataFim?: string;
    limite?: number;
  }): Observable<Blob> {
    let httpParams = new HttpParams().set('locale', this.i18n.getCurrentLanguage());
    if (params.dataInicio) {
      httpParams = httpParams.set('dataInicio', params.dataInicio);
    }
    if (params.dataFim) {
      httpParams = httpParams.set('dataFim', params.dataFim);
    }
    if (params.limite != null) {
      httpParams = httpParams.set('limite', String(params.limite));
    }
    return this.http.get(`${this.base}/export/zip`, { params: httpParams, responseType: 'blob' });
  }

  triggerZipDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Arquivo_Morte_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
