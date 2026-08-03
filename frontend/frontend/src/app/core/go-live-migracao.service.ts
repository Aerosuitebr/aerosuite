import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface GoLiveChecklistItem {
  week: number;
  order: number;
  i18nKey: string;
  itemKey?: string;
  routeLink?: string | null;
  concluido?: boolean;
  concluidoEm?: string | null;
}

export interface GoLiveChecklistSaveItem {
  itemKey: string;
  concluido: boolean;
}

export interface GoLiveTemplateInfo {
  id: string;
  i18nKey: string;
  fileName: string;
}

export interface GoLiveImportRequest {
  csv: string;
  dryRun?: boolean;
}

export interface GoLiveLinhaResult {
  linha: number;
  status: string;
  mensagem: string;
  referencia?: string;
  idCriado?: number;
  senhaTemporaria?: string;
}

export interface GoLiveImportResult {
  dryRun: boolean;
  totalLinhas: number;
  criados: number;
  ignorados: number;
  erros: number;
  linhas: GoLiveLinhaResult[];
}

export type GoLiveImportKind =
  | 'clientes-proposta'
  | 'fcu'
  | 'usuarios-externos'
  | 'fornecedores'
  | 'treinamentos'
  | 'documentos-sgq'
  | 'calibracao'
  | 'nao-conformidades';

@Injectable({ providedIn: 'root' })
export class GoLiveMigracaoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/go-live-migracao`;

  checklist(): Observable<GoLiveChecklistItem[]> {
    return this.http.get<GoLiveChecklistItem[]>(`${this.base}/checklist`);
  }

  salvarChecklist(itens: GoLiveChecklistSaveItem[]): Observable<GoLiveChecklistItem[]> {
    return this.http.put<GoLiveChecklistItem[]>(`${this.base}/checklist`, { itens });
  }

  templates(): Observable<GoLiveTemplateInfo[]> {
    return this.http.get<GoLiveTemplateInfo[]>(`${this.base}/templates`);
  }

  downloadTemplate(id: string): Observable<Blob> {
    return this.http.get(`${this.base}/templates/${id}/download`, { responseType: 'blob' });
  }

  import(kind: GoLiveImportKind, body: GoLiveImportRequest): Observable<GoLiveImportResult> {
    const pathMap: Record<GoLiveImportKind, string> = {
      'clientes-proposta': 'clientes-proposta',
      fcu: 'fcu',
      'usuarios-externos': 'usuarios-externos',
      fornecedores: 'fornecedores',
      treinamentos: 'treinamentos',
      'documentos-sgq': 'documentos-sgq',
      calibracao: 'calibracao',
      'nao-conformidades': 'nao-conformidades'
    };
    return this.http.post<GoLiveImportResult>(`${this.base}/import/${pathMap[kind]}`, body);
  }
}
