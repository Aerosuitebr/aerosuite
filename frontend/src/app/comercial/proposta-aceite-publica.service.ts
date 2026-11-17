import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface PropostaAceiteItem {
  produtoNome?: string;
  produtoDescricao?: string;
  produtoPn?: string;
  produtoSn?: string;
  quantidade?: number;
  valorUnitario?: number;
  valorTotal?: number;
}

export interface PropostaAceitePublica {
  oficinaNome?: string;
  oficinaContato?: string;
  id: number;
  numeroProposta?: string;
  status?: string;
  aceiteStatus?: string;
  podeEditar?: boolean;
  podeAceitar?: boolean;
  expirada?: boolean;
  mensagem?: string;
  dataProposta?: string;
  validadeProposta?: string;
  prazoEntrega?: string;
  formaPagamento?: string;
  observacoes?: string;
  moedaExibicao?: string;
  totalGeralExibicao?: number;
  totalGeralUsd?: number;
  freteUsd?: number;
  maoDeObraUsd?: number;
  subtotalProdutosUsd?: number;
  descontoValorCalculado?: number;
  cotacaoDolar?: number;
  clienteNome?: string;
  clienteCidade?: string;
  clienteEstado?: string;
  clienteContato?: string;
  produtoNome?: string;
  produtoPn?: string;
  produtoSn?: string;
  produtoManual?: string;
  aplicacaoMotor?: string;
  aeronavePrefixo?: string;
  servicoExecutado?: string;
  tipoServicoNome?: string;
  tsn?: string;
  tso?: string;
  csn?: string;
  cso?: string;
  pnMotor?: string;
  modeloMotor?: string;
  tempoDesdeHsi?: string;
  servicosFlags?: string;
  reporteCliente?: string;
  incidenteAcidente?: boolean | null;
  submersoAgua?: boolean | null;
  descricaoIncidente?: string;
  solicitanteNome?: string;
  solicitanteEmpresa?: string;
  solicitanteCargo?: string;
  solicitanteData?: string;
  aceitoEm?: string;
  aceiteNome?: string;
  aceiteEmail?: string;
  aceiteCargo?: string;
  aceiteEmpresa?: string;
  itens?: PropostaAceiteItem[];
  condicoesGerais?: string[];
}

export interface ServicosFlags {
  inspecao1800: boolean;
  revisaoGeral: boolean;
  hsi: boolean;
  teste: boolean;
  pesquisaPane: boolean;
}

@Injectable({ providedIn: 'root' })
export class PropostaAceitePublicaService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/public/propostas`;

  get(token: string): Observable<PropostaAceitePublica> {
    return this.http.get<PropostaAceitePublica>(`${this.base}/${token}`);
  }

  salvarSolicitacao(token: string, body: Partial<PropostaAceitePublica>): Observable<PropostaAceitePublica> {
    return this.http.put<PropostaAceitePublica>(`${this.base}/${token}/solicitacao`, body);
  }

  aceitar(token: string, body: {
    nome: string; email?: string; cargo?: string; empresa?: string;
    declaracao: boolean; autorizacao: boolean;
  }): Observable<PropostaAceitePublica> {
    return this.http.post<PropostaAceitePublica>(`${this.base}/${token}/aceitar`, body);
  }

  recusar(token: string, body: {
    nome?: string; email?: string; cargo?: string; empresa?: string; motivo: string;
  }): Observable<PropostaAceitePublica> {
    return this.http.post<PropostaAceitePublica>(`${this.base}/${token}/recusar`, body);
  }

  parseFlags(json?: string | null): ServicosFlags {
    const empty: ServicosFlags = { inspecao1800: false, revisaoGeral: false, hsi: false, teste: false, pesquisaPane: false };
    if (!json) return empty;
    try {
      return { ...empty, ...JSON.parse(json) };
    } catch {
      return empty;
    }
  }

  flagsToJson(flags: ServicosFlags): string {
    return JSON.stringify(flags);
  }

  flagsToLabel(flags: ServicosFlags): string {
    const labels: string[] = [];
    if (flags.inspecao1800) labels.push('Inspeção 1800H');
    if (flags.revisaoGeral) labels.push('Revisão geral');
    if (flags.hsi) labels.push('HSI');
    if (flags.teste) labels.push('Teste');
    if (flags.pesquisaPane) labels.push('Pesquisa de pane');
    return labels.join(', ');
  }
}
