import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslationService } from './translation.service';

export interface OsCrsState {
  osId: number;
  numeroOs: number;
  emitido: boolean;
  crsEmitidoEm?: string;
  crsLiberadoPorNome?: string;
  crsLiberadoPorCargo?: string;
  crsCertificadoNumero?: string;
  crsObservacoes?: string;
  checklistItensMarcados?: string[];
}

export interface OsCrsChecklistItem {
  code: string;
  label: string;
}

export interface OsCrsEmitirRequest {
  crsLiberadoPorNome: string;
  crsLiberadoPorCargo: string;
  crsCertificadoNumero?: string;
  crsObservacoes?: string;
  checklistConfirmados: string[];
}

@Injectable({ providedIn: 'root' })
export class OsCrsService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private base = `${environment.apiUrl}/os`;

  checklist(osId: number): Observable<{ itens: OsCrsChecklistItem[] }> {
    const params = new HttpParams().set('locale', this.i18n.getCurrentLanguage());
    return this.http.get<{ itens: OsCrsChecklistItem[] }>(`${this.base}/${osId}/crs/checklist`, { params });
  }

  obter(osId: number): Observable<OsCrsState> {
    return this.http.get<OsCrsState>(`${this.base}/${osId}/crs`);
  }

  emitir(osId: number, body: OsCrsEmitirRequest): Observable<OsCrsState> {
    const params = new HttpParams().set('locale', this.i18n.getCurrentLanguage());
    return this.http.post<OsCrsState>(`${this.base}/${osId}/crs/emitir`, body, { params });
  }

  downloadPdf(osId: number): Observable<Blob> {
    const params = new HttpParams().set('locale', this.i18n.getCurrentLanguage());
    return this.http.get(`${this.base}/${osId}/crs/pdf`, { params, responseType: 'blob' });
  }
}
