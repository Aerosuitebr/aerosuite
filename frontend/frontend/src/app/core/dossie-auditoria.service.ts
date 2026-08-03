import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslationService } from './translation.service';

export interface PacoteAuditoriaResumo {
  totalOsIncluidas: number;
  limiteMaximo: number;
  dataInicio?: string;
  dataFim?: string;
  ordens: {
    osId: number;
    numeroOs: number;
    clienteNome?: string;
    dtAbertura?: string;
    crsEmitido?: boolean;
    totalAnexos?: number;
  }[];
}

export interface DossieAuditoriaResumo {
  osId: number;
  numeroOs: number;
  totalAnexos: number;
  totalMovimentosEstoque: number;
  totalAuditoriaOs: number;
  totalAcessoExterno: number;
  totalAcessoInterno: number;
}

@Injectable({ providedIn: 'root' })
export class DossieAuditoriaService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private base = `${environment.apiUrl}/dossie-auditoria`;

  resumoByNumero(numeroOs: number): Observable<DossieAuditoriaResumo> {
    return this.http.get<DossieAuditoriaResumo>(`${this.base}/numero/${numeroOs}/resumo`);
  }

  downloadPdfByNumero(numeroOs: number): Observable<Blob> {
    const locale = this.i18n.getCurrentLanguage();
    const params = new HttpParams().set('locale', locale);
    return this.http.get(`${this.base}/numero/${numeroOs}/pdf`, {
      params,
      responseType: 'blob'
    });
  }

  pacoteResumo(params: {
    dataInicio?: string;
    dataFim?: string;
    limite?: number;
    numerosOs?: string;
  }): Observable<PacoteAuditoriaResumo> {
    let httpParams = new HttpParams();
    if (params.dataInicio) {
      httpParams = httpParams.set('dataInicio', params.dataInicio);
    }
    if (params.dataFim) {
      httpParams = httpParams.set('dataFim', params.dataFim);
    }
    if (params.limite != null) {
      httpParams = httpParams.set('limite', String(params.limite));
    }
    if (params.numerosOs) {
      httpParams = httpParams.set('numerosOs', params.numerosOs);
    }
    return this.http.get<PacoteAuditoriaResumo>(`${this.base}/pacote/resumo`, { params: httpParams });
  }

  downloadPacoteZip(params: {
    dataInicio?: string;
    dataFim?: string;
    limite?: number;
    numerosOs?: string;
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
    if (params.numerosOs) {
      httpParams = httpParams.set('numerosOs', params.numerosOs);
    }
    return this.http.get(`${this.base}/pacote/zip`, { params: httpParams, responseType: 'blob' });
  }

  triggerZipDownload(blob: Blob): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Pacote_Auditoria_${new Date().toISOString().slice(0, 10)}.zip`;
    a.click();
    URL.revokeObjectURL(url);
  }

  triggerDownload(blob: Blob, numeroOs: number): void {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Dossie_OS_${numeroOs}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  }
}
