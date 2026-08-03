import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { OSFile } from './os-file.service';

export interface JobCardListItem {
  osId: number;
  numeroOs: number;
  clienteNome?: string;
  partNumber?: string;
  serialNumber?: string;
  marcasMatricula?: string;
  dtAbertura?: string;
  tipoServico?: string;
  faseJob?: JobCardFase;
  progressPct?: number;
  assinaturasConcluidas?: number;
  crsEmitido?: boolean;
}

export type JobCardFase = 'A_FAZER' | 'EM_ANDAMENTO' | 'AGUARDANDO_PECA' | 'CONCLUIDO';

export interface JobCardApontamento {
  id: number;
  trabalhoEm: string;
  horas: number;
  descricao?: string;
  ferramentaIdentificador?: string;
  usuarioNome?: string;
  createdAt?: string;
}

export interface JobCardAssinatura {
  id?: number;
  papel: string;
  assinadoEm?: string;
  usuarioNome?: string;
  presente: boolean;
  assinaturaSha256?: string;
  assinaturaTimestampServer?: string;
  integridadeOk?: boolean | null;
}

export interface JobCard {
  osId: number;
  numeroOs: number;
  clienteNome?: string;
  partNumber?: string;
  serialNumber?: string;
  tipoServico?: string;
  dtAbertura?: string;
  dataFechamento?: string;
  inicioServico?: string;
  fimServico?: string;
  obsIniServ?: string;
  obsFimServ?: string;
  crsEmitido?: boolean;
  alertaCrsSegregacao?: boolean;
  alertasConformidade?: string[];
  totalHoras?: number;
  apontamentos: JobCardApontamento[];
  assinaturas: JobCardAssinatura[];
  fotos: OSFile[];
}

@Injectable({ providedIn: 'root' })
export class JobCardService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/os/job-card`;

  listarAbertas(q?: string, limite = 50): Observable<{ itens: JobCardListItem[]; total: number }> {
    let url = `${this.base}/abertas?limite=${limite}`;
    if (q?.trim()) {
      url += `&q=${encodeURIComponent(q.trim())}`;
    }
    return this.http.get<{ itens: JobCardListItem[]; total: number }>(url);
  }

  obter(osId: number): Observable<JobCard> {
    return this.http.get<JobCard>(`${this.base}/${osId}`);
  }

  registrarApontamento(
    osId: number,
    body: { trabalhoEm: string; horas: number; descricao?: string; ferramentaIdentificador?: string }
  ): Observable<JobCardApontamento> {
    return this.http.post<JobCardApontamento>(`${this.base}/${osId}/apontamentos`, body);
  }

  atualizarExecucao(
    osId: number,
    body: { inicioServico?: string; fimServico?: string; obsIniServ?: string; obsFimServ?: string }
  ): Observable<JobCard> {
    return this.http.put<JobCard>(`${this.base}/${osId}/execucao`, body);
  }

  salvarAssinatura(osId: number, body: { papel: string; assinaturaPngBase64: string }): Observable<JobCardAssinatura> {
    return this.http.post<JobCardAssinatura>(`${this.base}/${osId}/assinatura`, body);
  }
}
