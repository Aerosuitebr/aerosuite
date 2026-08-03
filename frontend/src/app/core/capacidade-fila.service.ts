import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { UsuarioExternoService } from './usuario-externo.service';

export interface CapacidadeQuadroCard {
  osId: number;
  numeroOs: number;
  clienteNome?: string;
  partNumber?: string;
  serialNumber?: string;
  tipoServico?: string;
  dtAbertura?: string;
  prioridadeFila: string;
  filaEstagio: string;
  dataPrevistaConclusao?: string;
  slaStatus: string;
  posicaoFila: number;
  temDeficitKitFcu: boolean;
  hangarId?: number;
  hangarNome?: string;
}

export interface HangarOption {
  id: number;
  codigo: string;
  nome: string;
  ordem?: number;
  ativo?: boolean;
}

export interface CapacidadeQuadroColuna {
  estagio: string;
  cartoes: CapacidadeQuadroCard[];
}

export interface CapacidadeQuadro {
  colunas: CapacidadeQuadroColuna[];
  totalAbertas: number;
}

export interface CapacidadeOsUpdate {
  prioridadeFila?: string;
  filaEstagio?: string;
  dataPrevistaConclusao?: string | null;
  hangarId?: number | null;
}

export interface CapacidadeExternoItem {
  osId: number;
  numeroOs: number;
  clienteNome?: string;
  partNumber?: string;
  serialNumber?: string;
  filaEstagio: string;
  prioridadeFila: string;
  posicaoFila: number;
  dataPrevistaConclusao?: string;
  slaStatus: string;
  status: string;
  temDeficitKitFcu: boolean;
}

@Injectable({ providedIn: 'root' })
export class CapacidadeFilaService {
  private http = inject(HttpClient);
  private externo = inject(UsuarioExternoService);
  private base = `${environment.apiUrl}/capacidade`;

  listarHangares(): Observable<HangarOption[]> {
    return this.http.get<HangarOption[]>(`${this.base}/hangares`);
  }

  obterQuadro(hangarId?: number | null): Observable<CapacidadeQuadro> {
    let params = new HttpParams();
    if (hangarId != null && hangarId > 0) {
      params = params.set('hangarId', String(hangarId));
    }
    return this.http.get<CapacidadeQuadro>(`${this.base}/quadro`, { params });
  }

  atualizarOs(osId: number, body: CapacidadeOsUpdate): Observable<CapacidadeQuadroCard> {
    return this.http.put<CapacidadeQuadroCard>(`${this.base}/os/${osId}`, body);
  }

  atualizarOsEmLote(updates: { osId: number; filaEstagio: string }[]): Observable<CapacidadeQuadroCard[]> {
    return this.http.put<CapacidadeQuadroCard[]>(`${this.base}/os/batch`, { updates });
  }

  listarExterno(): Observable<CapacidadeExternoItem[]> {
    const user = this.externo.getCurrentUser();
    if (!user?.id) {
      throw new Error('externo not logged in');
    }
    return this.http.get<CapacidadeExternoItem[]>(
      `${environment.apiUrl}/auth-externo/me/${user.id}/capacidade`
    );
  }
}
