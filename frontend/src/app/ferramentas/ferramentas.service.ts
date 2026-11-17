import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Observable } from 'rxjs';
import { obterTerminalId } from '../core/terminal-id';

export interface TerminalFerramentaria { vinculada: boolean; ferramentaria: boolean; terminalId?: string; estacaoCodigo?: string; estacaoNome?: string; maquina?: string; }
export interface PareamentoFerramentaria { codigo?: string; expiraEm?: string; segundosRestantes: number; vinculada: boolean; }

export interface Ferramenta {
  id: number; codigo: string; descricao: string; tipo: string; marca: string; modelo: string; serie: string; posicao: string;
  condicao: string; bloqueioOperacional?: string; exigeCalibracao: boolean; intervalo: number; unidade: string; alertas: string; criterio: string;
  ultimaCalibracao?: string; proximaCalibracao?: string;
}
export interface Custodia { id: number; osId: number; mecanicoId: number; localizacao: string; retiradaEm: string; retornoPrevisto: string; previsaoAtualizadaEm: string; }
export interface ItemFerramenta { ferramenta: Ferramenta; custodia?: Custodia; mecanico?: string; osNumero?: string; entreguePor?: string; restricao?: string; situacao: string; atrasada: boolean; recolher: boolean; diasCalibracao?: number; localizacao?: string; }
export interface Movimento { terminalId?: string; estacaoNome?: string; maquina?: string; id: number; ferramentaId: number; osId: number; mecanicoId: number; tipo: string; retornoPrevisto: string; localizacao: string; entregaPor?: number; recebidoPor?: number; cienciaPor?: number; criadoEm: string; }
export interface Pendente { movimento: Movimento; codigo: string; descricao: string; mecanico: string; osNumero: string; origem?: string; }
export interface Calibracao { id: number; ferramentaId: number; laboratorioId: number; status: string; enviadaEm: string; retornoPrevisto: string; realizadaEm?: string; certificado?: string; resultados?: string; analise?: string; proximaCalculada?: string; }
export interface Contexto { pessoas: {id: number; nome: string; email: string}[]; ordens: {id: number; numero: number; descricao: string; mecanicoResponsavelId?: number | null}[]; laboratorios: {id: number; nome: string; contato: string; escopo: string; consultaAcreditacao: string}[]; permissoes: string[]; }
export interface Evento { id: number; tipo: string; autor: string; ocorridoEm: string; detalhe: string; osId?: number; terminalId?: string; estacaoCodigo?: string; estacaoNome?: string; maquina?: string; }

@Injectable({providedIn: 'root'})
export class FerramentasService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/ferramentas`;
  readonly terminalId=obterTerminalId();
  private get options() { return {headers: new HttpHeaders({'X-Terminal-Id':this.terminalId})}; }
  get<T>(path = ''): Observable<T> { return this.http.get<T>(`${this.base}${path}`, this.options); }
  post<T>(path: string, data: unknown): Observable<T> { return this.http.post<T>(`${this.base}${path}`, data, this.options); }
  put<T>(path: string, data: unknown): Observable<T> { return this.http.put<T>(`${this.base}${path}`, data, this.options); }
  certificado(id: number) { return this.http.get(`${this.base}/calibracoes/${id}/certificado`, {...this.options, responseType: 'blob'}); }
}
