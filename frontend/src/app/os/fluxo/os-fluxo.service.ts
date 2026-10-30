import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';

export type FluxoSituacao = 'EM_ETAPA' | 'AGUARDANDO' | 'CONCLUIDO';
export type FluxoAcao = 'ENTRADA' | 'SAIDA' | 'AUTO';

export interface FluxoEtapa {
  id: number;
  codigo: string;
  nome: string;
  setor?: string | null;
  ordem: number;
  cor?: string | null;
  icone?: string | null;
  codigoBarrasEntrada: string;
  codigoBarrasSaida: string;
  metaMinutos?: number | null;
  ativo?: boolean;
}

export interface FluxoOsResumo {
  id: number;
  codigo: string;
  cliente?: string | null;
  partNumber?: string | null;
  serialNumber?: string | null;
  numOsOriginal?: string | null;
  mecanicoNome?: string | null;
  statusOperacional?: string | null;
  fluxoSituacao?: FluxoSituacao | null;
  fluxoEtapaId?: number | null;
  fluxoAtualizadoEm?: string | null;
}

export type FluxoCampoSugestao = 'CODIGO' | 'OS_ORIGINAL' | 'SN' | 'PN' | 'CLIENTE';

export interface FluxoSugestaoOs {
  os: FluxoOsResumo;
  etapa?: FluxoEtapa | null;
  dtAbertura?: string | null;
  tipoServico?: string | null;
  marcasMatricula?: string | null;
  campoEncontrado: FluxoCampoSugestao;
}

/** OS da fila de uma estação: `etapa` é a etapa a registrar (saída da atual ou entrada na próxima). */
export interface FluxoFilaItem {
  os: FluxoOsResumo;
  etapa?: FluxoEtapa | null;
  acao: 'ENTRADA' | 'SAIDA';
  dtAbertura?: string | null;
  tipoServico?: string | null;
  marcasMatricula?: string | null;
  desdeSegundos?: number | null;
}

export interface FluxoRegistro {
  id: number;
  osId: number;
  etapaId: number;
  etapaNome: string;
  etapaCor?: string | null;
  etapaOrdem?: number | null;
  sequencia: number;
  entradaEm: string;
  entradaUsuarioNome?: string | null;
  entradaOrigem?: string | null;
  entradaEstacao?: string | null;
  saidaEm?: string | null;
  saidaUsuarioNome?: string | null;
  saidaOrigem?: string | null;
  saidaEstacao?: string | null;
  duracaoSegundos?: number | null;
  esperaAnteriorSegundos?: number | null;
  forcado?: boolean;
  observacao?: string | null;
  anulado?: boolean;
  anuladoEm?: string | null;
  anuladoUsuarioNome?: string | null;
  anuladoMotivo?: string | null;
  metaMinutos?: number | null;
}

export interface FluxoEvento {
  id: number;
  osId?: number | null;
  etapaId?: number | null;
  etapaNome?: string | null;
  etapaCor?: string | null;
  acao: string;
  sucesso: boolean;
  mensagem?: string | null;
  codigoOsLido?: string | null;
  codigoEtapaLido?: string | null;
  origem?: string | null;
  estacao?: string | null;
  usuarioNome?: string | null;
  ip?: string | null;
  ocorridoEm: string;
}

export interface FluxoBiparRequest {
  osCodigo: string;
  etapaCodigo?: string | null;
  etapaId?: number | null;
  acao?: FluxoAcao | null;
  origem?: 'SCANNER' | 'MANUAL';
  estacao?: string | null;
  observacao?: string | null;
  forcar?: boolean;
  motivo?: string | null;
  terminalId?: string | null;
}

export interface FluxoBiparResultado {
  sucesso: boolean;
  acao: 'ENTRADA' | 'SAIDA';
  mensagem: string;
  os: FluxoOsResumo;
  etapa: FluxoEtapa;
  registro: FluxoRegistro;
  proximaEtapa?: FluxoEtapa | null;
  situacao: FluxoSituacao;
  forcado: boolean;
  etapasConcluidas: number;
  totalEtapas: number;
}

export interface FluxoErro {
  sucesso: false;
  codigo: string;
  mensagem: string;
  detalhes?: { etapaEsperadaId?: number; etapaEsperadaNome?: string; podeForcar?: boolean; etapaAbertaId?: number };
}

export interface FluxoEstadoOs {
  os: FluxoOsResumo;
  etapaAtual?: FluxoEtapa | null;
  registroAberto?: FluxoRegistro | null;
  proximaEtapa?: FluxoEtapa | null;
  etapasConcluidas: number;
  totalEtapas: number;
  podeGerir: boolean;
}

export interface FluxoKpis {
  osEmFluxo: number;
  osEmEtapa: number;
  osAguardando: number;
  iniciadasPeriodo: number;
  concluidasPeriodo: number;
  cicloMedioSeg?: number | null;
  cicloMedianoSeg?: number | null;
  cicloP90Seg?: number | null;
  passagensConcluidas: number;
  bipagens: number;
  rejeicoes: number;
  taxaRejeicaoPct?: number | null;
  noPrazoPct?: number | null;
  forcados: number;
  estornos: number;
}

export interface FluxoEtapaMetrica {
  etapa: FluxoEtapa;
  emAndamento: number;
  aguardando: number;
  concluidas: number;
  mediaSeg?: number | null;
  medianaSeg?: number | null;
  p90Seg?: number | null;
  minSeg?: number | null;
  maxSeg?: number | null;
  esperaMediaSeg?: number | null;
  noPrazoPct?: number | null;
  maisAntigoAbertoSeg?: number | null;
  estouradosAbertos: number;
}

export interface FluxoAberto {
  tipo: 'EM_ETAPA' | 'AGUARDANDO';
  registroId?: number | null;
  os: FluxoOsResumo;
  etapa?: FluxoEtapa | null;
  desde?: string | null;
  usuarioNome?: string | null;
  decorridoSeg: number;
  metaMinutos?: number | null;
  estourado: boolean;
}

export interface FluxoDashboard {
  geradoEm: string;
  de: string;
  ate: string;
  kpis: FluxoKpis;
  etapas: FluxoEtapaMetrica[];
  abertos: FluxoAberto[];
  throughput: { dia: string; entradas: number; saidas: number; concluidas: number }[];
  porUsuario: { usuarioId?: number | null; nome: string; entradas: number; saidas: number; mediaEtapaSeg?: number | null }[];
  ultimosEventos: FluxoEvento[];
}

export interface FluxoEtapaStatus {
  etapa: FluxoEtapa;
  status: 'PENDENTE' | 'EM_ANDAMENTO' | 'CONCLUIDA';
  passagens: number;
  totalSeg?: number | null;
  primeiraEntradaEm?: string | null;
  ultimaSaidaEm?: string | null;
  estourado: boolean;
}

export interface FluxoDetalhe {
  os: FluxoOsResumo;
  etapas: FluxoEtapaStatus[];
  registros: FluxoRegistro[];
  eventos: FluxoEvento[];
  resumo: {
    inicioEm?: string | null;
    fimEm?: string | null;
    cicloSeg?: number | null;
    tempoEmEtapasSeg?: number | null;
    tempoEsperaSeg?: number | null;
    eficienciaPct?: number | null;
    etapasConcluidas: number;
    totalEtapas: number;
    forcados: number;
    anulados: number;
    rejeicoes: number;
  };
  proximaEtapa?: FluxoEtapa | null;
  podeGerir: boolean;
  geradoEm: string;
}

export interface FluxoOsListaItem {
  os: FluxoOsResumo;
  etapa?: FluxoEtapa | null;
  etapasConcluidas: number;
  totalEtapas: number;
  desdeSeg?: number | null;
  inicioFluxoEm?: string | null;
}

export type FluxoAjusteTipo = 'ZERAR' | 'POSICIONAR';
export type FluxoAjusteDirecao = 'AVANCO' | 'RETROCESSO' | 'ZERAR' | 'REPOSICIONAR' | 'SEM_MUDANCA';
export type FluxoAjusteEfeitoTipo = 'ANULAR' | 'FECHAR' | 'REABRIR' | 'CRIAR_ABERTO' | 'CRIAR_CONCLUIDO';

export interface FluxoAjusteRequest {
  tipo: FluxoAjusteTipo;
  etapaId?: number | null;
  situacao?: 'EM_ETAPA' | 'CONCLUIDA' | null;
  preencherIntermediarias?: boolean;
  motivo?: string | null;
}

export interface FluxoAjusteEfeito {
  tipo: FluxoAjusteEfeitoTipo;
  etapaId?: number | null;
  etapaNome?: string | null;
  etapaCor?: string | null;
  etapaOrdem?: number | null;
  registroId?: number | null;
  descricao: string;
}

export interface FluxoAjustePlano {
  os: FluxoOsResumo;
  direcao: FluxoAjusteDirecao;
  situacaoAtual?: FluxoSituacao | null;
  etapaAtual?: FluxoEtapa | null;
  situacaoFinal?: FluxoSituacao | null;
  etapaFinal?: FluxoEtapa | null;
  efeitos: FluxoAjusteEfeito[];
  anulados: number;
  criados: number;
  etapasPuladas: number;
}

/** Estação gerada pelo servidor a partir das etapas (uma por setor); várias máquinas podem atender a mesma estação. */
export interface FluxoEstacao {
  codigo: string;
  nome: string;
  setor?: string | null;
  ordem: number;
  cor?: string | null;
  etapaIds: number[];
  desteTerminal: boolean;
  emUso: boolean;
  emUsoPor?: string | null;
  ultimoAcesso?: string | null;
  terminais: number;
}

export interface FluxoEstacoes {
  estacoes: FluxoEstacao[];
  estacaoDesteTerminal?: string | null;
  maquinaDesteTerminal?: string | null;
  solicitacaoAberta?: boolean;
}

export interface FluxoEstacaoGestao {
  monitoradoDesde?: string | null;
  semVinculoDesde?: string | null;
  codigo: string;
  nome: string;
  nomePadrao: string;
  nomePersonalizado: boolean;
  setor?: string | null;
  cor?: string | null;
  etapas: string[];
  maquinas: number;
}

export interface FluxoMaquina {
  terminalId: string;
  apelido?: string | null;
  estacaoCodigo: string;
  estacaoNome?: string | null;
  usuarioNome?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  vinculadoEm?: string | null;
  ultimoAcesso?: string | null;
  ativa: boolean;
}

export interface FluxoEstacoesGestao {
  pendentes?: FluxoMaquinaPendente[];
  setores?: string[];
  estacoes: FluxoEstacaoGestao[];
  maquinas: FluxoMaquina[];
}

export interface FluxoMaquinaPendente { terminalId: string; usuarioNome?: string; userAgent?: string; ip?: string | null; ultimoAcesso?: string; expiraEm?: string; }
export interface FluxoVinculoEvento { acao: string; terminalId: string; apelido?: string; estacaoAnterior?: string; estacaoNova?: string; responsavel?: string; ocorridoEm: string; }
export interface FluxoPareamento {
  codigo: string | null;
  expiraEm: string | null;
  segundosRestantes: number;
  vinculada: boolean;
}

export interface FluxoPareamentoInfo {
  codigo: string;
  usuarioNome?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  criadoEm?: string | null;
  expiraEm?: string | null;
}

export interface FluxoPage<T> {
  items: T[];
  total: number;
  page: number;
  size: number;
}

@Injectable({ providedIn: 'root' })
export class OsFluxoService {
  private http = inject(HttpClient);
  private base = `${environment.apiUrl}/os-fluxo`;

  etapas() {
    return this.http.get<FluxoEtapa[]>(`${this.base}/etapas`);
  }

  atualizarMeta(etapaId: number, metaMinutos: number | null) {
    return this.http.put<FluxoEtapa>(`${this.base}/etapas/${etapaId}/meta`, { metaMinutos });
  }

  bipar(req: FluxoBiparRequest) {
    return this.http.post<FluxoBiparResultado>(`${this.base}/bipar`, req);
  }

  estado(codigo: string) {
    return this.http.get<FluxoEstadoOs>(`${this.base}/estado`, { params: new HttpParams().set('codigo', codigo) });
  }

  dashboard(de?: string | null, ate?: string | null) {
    let p = new HttpParams();
    if (de) p = p.set('de', de);
    if (ate) p = p.set('ate', ate);
    return this.http.get<FluxoDashboard>(`${this.base}/dashboard`, { params: p });
  }

  eventos(de?: string | null, ate?: string | null, sucesso?: boolean | null, limite = 500) {
    let p = new HttpParams().set('limite', String(limite));
    if (de) p = p.set('de', de);
    if (ate) p = p.set('ate', ate);
    if (sucesso != null) p = p.set('sucesso', String(sucesso));
    return this.http.get<FluxoEvento[]>(`${this.base}/eventos`, { params: p });
  }

  listarOs(filtro: { situacao?: string | null; etapaId?: number | null; q?: string | null; page?: number; size?: number }) {
    let p = new HttpParams().set('page', String(filtro.page ?? 0)).set('size', String(filtro.size ?? 25));
    if (filtro.situacao) p = p.set('situacao', filtro.situacao);
    if (filtro.etapaId != null) p = p.set('etapaId', String(filtro.etapaId));
    if (filtro.q) p = p.set('q', filtro.q);
    return this.http.get<FluxoPage<FluxoOsListaItem>>(`${this.base}/os`, { params: p });
  }

  sugerirOs(q: string, limite = 8) {
    const p = new HttpParams().set('q', q).set('limite', String(limite));
    return this.http.get<FluxoSugestaoOs[]>(`${this.base}/os/sugestoes`, { params: p });
  }

  fila(etapaIds: number[], limite = 60, terminal?: string) {
    let p = new HttpParams().set('limite', String(limite));
    if (etapaIds.length) p = p.set('etapaIds', etapaIds.join(','));
    if (terminal) p = p.set('terminal', terminal);
    return this.http.get<FluxoFilaItem[]>(`${this.base}/fila`, { params: p });
  }

  estacoes(terminal: string) {
    return this.http.get<FluxoEstacoes>(`${this.base}/estacoes`, { params: new HttpParams().set('terminal', terminal) });
  }

  vincularEstacao(terminalId: string, estacaoCodigo: string) {
    return this.http.put<FluxoEstacoes>(`${this.base}/estacoes/vinculo`, { terminalId, estacaoCodigo });
  }

  aprovarMaquina(terminalId: string,estacaoCodigo: string,apelido: string) { return this.http.post<FluxoEstacoesGestao>(`${this.base}/maquinas/${encodeURIComponent(terminalId)}/aprovar`,{estacaoCodigo,apelido}); }
  historicoEstacao(codigo: string) { return this.http.get<FluxoVinculoEvento[]>(`${this.base}/estacoes/${encodeURIComponent(codigo)}/historico`); }
  gestaoEstacoes() {
    return this.http.get<FluxoEstacoesGestao>(`${this.base}/estacoes/gestao`);
  }

  renomearEstacao(codigo: string, nome: string) {
    return this.http.put<FluxoEstacoesGestao>(`${this.base}/estacoes/${encodeURIComponent(codigo)}/nome`, { nome });
  }

  criarEstacao(nome: string, setor: string) {
    return this.http.post<FluxoEstacoesGestao>(`${this.base}/estacoes`, { nome, setor });
  }

  excluirEstacao(codigo: string) {
    return this.http.delete<FluxoEstacoesGestao>(`${this.base}/estacoes/${encodeURIComponent(codigo)}`);
  }

  atualizarMaquina(terminalId: string, estacaoCodigo: string, apelido: string) {
    return this.http.put<FluxoEstacoesGestao>(`${this.base}/maquinas/${encodeURIComponent(terminalId)}`, { estacaoCodigo, apelido });
  }

  removerMaquina(terminalId: string) {
    return this.http.delete<FluxoEstacoesGestao>(`${this.base}/maquinas/${encodeURIComponent(terminalId)}`);
  }

  cancelarSolicitacao(terminalId: string) {
    return this.http.delete<FluxoEstacoesGestao>(`${this.base}/maquinas/${encodeURIComponent(terminalId)}/solicitacao`);
  }

  solicitarPareamento(terminalId: string) {
    return this.http.post<FluxoPareamento>(`${this.base}/estacoes/pareamento`, { terminalId });
  }

  consultarPareamento(codigo: string) {
    return this.http.get<FluxoPareamentoInfo>(`${this.base}/estacoes/pareamento/${encodeURIComponent(codigo)}`);
  }

  concluirPareamento(codigo: string, estacaoCodigo: string, apelido: string) {
    return this.http.post<FluxoEstacoesGestao>(`${this.base}/estacoes/pareamento/${encodeURIComponent(codigo)}`, { estacaoCodigo, apelido });
  }

  detalhe(osId: number) {
    return this.http.get<FluxoDetalhe>(`${this.base}/os/${osId}`);
  }

  estornar(osId: number, motivo: string) {
    return this.http.post<FluxoDetalhe>(`${this.base}/os/${osId}/estornar`, { motivo });
  }

  simularAjuste(osId: number, req: FluxoAjusteRequest) {
    return this.http.post<FluxoAjustePlano>(`${this.base}/os/${osId}/ajuste/simular`, req);
  }

  aplicarAjuste(osId: number, req: FluxoAjusteRequest) {
    return this.http.post<FluxoDetalhe>(`${this.base}/os/${osId}/ajuste`, req);
  }
}

/** Formata segundos como "2d 4h", "3h 12min", "45min" ou "30s". */
export function formatarDuracao(seg?: number | null): string {
  if (seg == null || !Number.isFinite(seg)) return '—';
  const s = Math.max(0, Math.round(seg));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}d ${h}h`;
  if (h > 0) return `${h}h ${String(m).padStart(2, '0')}min`;
  if (m > 0) return `${m}min`;
  return `${s}s`;
}

/** Data/hora local vinda do backend (LocalDateTime ISO sem fuso). */
export function parseDataLocal(v?: string | null): Date | null {
  if (!v) return null;
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:[T ](\d{2}):(\d{2})(?::(\d{2}))?)?/.exec(v);
  if (!m) {
    const d = new Date(v);
    return Number.isNaN(d.getTime()) ? null : d;
  }
  return new Date(+m[1], +m[2] - 1, +m[3], +(m[4] || 0), +(m[5] || 0), +(m[6] || 0));
}

export function formatarDataHora(v?: string | null, comSegundos = false): string {
  const d = parseDataLocal(v);
  if (!d) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  const base = `${p(d.getDate())}/${p(d.getMonth() + 1)}/${d.getFullYear()} ${p(d.getHours())}:${p(d.getMinutes())}`;
  return comSegundos ? `${base}:${p(d.getSeconds())}` : base;
}

export function formatarHora(v?: string | null): string {
  const d = parseDataLocal(v);
  if (!d) return '—';
  const p = (n: number) => String(n).padStart(2, '0');
  return `${p(d.getHours())}:${p(d.getMinutes())}:${p(d.getSeconds())}`;
}

export function dataIso(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** Código de barras impresso na etiqueta da OS (apenas A-Z/0-9 para evitar problemas de layout de teclado do leitor). */
export function codigoBarrasOs(osId: number): string {
  return `OS${osId}`;
}

/** Abre uma janela só com o conteúdo informado e dispara a impressão (etiquetas / folhas de códigos). */
export function imprimirHtml(titulo: string, html: string, css = ''): void {
  const w = window.open('', '_blank', 'width=900,height=700');
  if (!w) return;
  w.document.open();
  w.document.write(`<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>${titulo}</title>
    <style>
      @page { margin: 10mm; }
      * { box-sizing: border-box; }
      body { font-family: 'Segoe UI', Arial, sans-serif; color: #0b1220; margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
      svg { max-width: 100%; }
      ${css}
    </style></head><body>${html}
    <script>window.onload = function () { setTimeout(function () { window.focus(); window.print(); }, 250); };<\/script>
    </body></html>`);
  w.document.close();
}

export function labelSituacao(s?: string | null): string {
  switch (s) {
    case 'EM_ETAPA': return 'Em etapa';
    case 'AGUARDANDO': return 'Aguardando próxima etapa';
    case 'CONCLUIDO': return 'Fluxo concluído';
    default: return 'Não iniciado';
  }
}
