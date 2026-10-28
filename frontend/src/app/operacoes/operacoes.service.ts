import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
export interface Operacao { id?: number; version?: number; modulo: string; osId?: number|null; itemId?: number|null; ferramentaId?: number|null; origemId?: number|null; tecnicoId?: number|null; titulo: string; status: string; tipo?: string; responsavel?: string; referencia?: string; recurso?: string; proximaAcao?: string; observacao?: string; prazo?: string; inicio?: string; fim?: string; quantidade?: number; quantidadeConsumida?: number; valor?: number; horas?: number; capacidade?: number; createdAt?: string; updatedAt?: string; closedAt?: string; }
export interface Contexto { os: {id:number;codigo:number;cliente:string;pn:string;sn:string}[]; itens:{id:number;pn:string;rastreio:string;lote:string;fisico:number;reservado:number;livre:number}[]; ferramentas:{id:number;identificador:string;descricao:string;validade:string}[]; tecnicos:{id:number;nome:string}[]; operacoesPermitidas:boolean;saidaPermitida:boolean;custosPermitidos:boolean; }
export interface Resumo { receitaAprovada?:number;resultadoOperacional?:number; impedimentos:number; materiaisPendentes:number; horasApontadas:number; checagens:{nome:string;ok:boolean}[]; historico:{id:number;codigo:number;abertura:string;servico:string;fechamento:string}[]; custos?:{previsto:number;lancado:number;materiais:number;realizado:number;desvio:number;materiaisSemCusto:number}; }
@Injectable({providedIn:'root'}) export class OperacoesService {
 private http=inject(HttpClient);private url='/api/operacoes';
 contexto(q=''){return this.http.get<Contexto>(this.url+'/contexto',{params:{q}});}
 listar(modulo:string,osId:number|null){let params=new HttpParams();if(osId)params=params.set('osId',osId);return this.http.get<Operacao[]>(this.url+'/'+modulo,{params});}
 salvar(r:Operacao){return r.id?this.http.put<Operacao>(this.url+'/'+r.modulo+'/'+r.id,r):this.http.post<Operacao>(this.url+'/'+r.modulo,r);}
 consumir(r:Operacao){return this.http.post<Operacao>(this.url+'/materiais/'+r.id+'/consumir',{version:r.version});}
 resumo(id:number){return this.http.get<Resumo>(this.url+'/os/'+id+'/resumo');}
 eventos(id:number){return this.http.get<{id:number;autor:string;descricao:string;createdAt:string}[]>(this.url+'/eventos/'+id);}
}
