import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslationService } from './translation.service';

export interface NrcPage<T> {
  items: T[];
  totalElements: number;
  totalPages: number;
  page: number;
  size: number;
}

export interface NrcAcao {
  id?: number;
  nrcId?: number;
  descricao?: string;
  oQue?: string;
  porQue?: string;
  onde?: string;
  quandoAcao?: string;
  responsavelId?: number;
  responsavelNome?: string;
  como?: string;
  quantoCusto?: string;
  prazo?: string;
  status?: string;
  dataConclusao?: string;
  evidenciaConclusao?: string;
  concluidoPorId?: number;
  concluidoPorNome?: string;
  ordemItem?: number;
}

export interface NrcAuditoria {
  id?: number;
  nrcId?: number;
  acao?: string;
  campo?: string;
  valorAnterior?: string;
  valorNovo?: string;
  usuarioId?: number;
  usuarioNome?: string;
  dataHora?: string;
}

export interface NrcAnexo {
  id?: number;
  nrcId?: number;
  nomeArquivo?: string;
  nomeOriginal?: string;
  tipoArquivo?: string;
  tamanhoBytes?: number;
  caminhoArquivo?: string;
  urlDownload?: string;
  descricao?: string;
  categoria?: string;
  usuarioId?: number;
  usuarioNome?: string;
  dataUpload?: string;
  isActive?: boolean;
}

export interface Nrc {
  id?: number;
  numero?: string;
  status?: string;
  dataDeteccao?: string;
  dataOcorrencia?: string;
  detectadoPorId?: number;
  detectadoPorNome?: string;
  origem?: string;
  tipoNc?: string;
  severidade?: string;
  descricaoOcorrido?: string;
  requisitoNaoAtendido?: string;
  documentoEnvolvido?: string;
  requisitoReferencia?: string;
  evidenciasTexto?: string;
  localOcorrencia?: string;
  osId?: number;
  osNumero?: string;
  partNumber?: string;
  serialNumber?: string;
  invoiceId?: number;
  invoiceNumero?: string;
  loteId?: number;
  loteCodigo?: string;
  clienteNome?: string;
  fcuId?: number;
  fcuCodigo?: string;
  prazoTratamento?: string;
  custoNaoConformidade?: number | null;
  responsavelTratamentoId?: number;
  responsavelTratamentoNome?: string;
  prazoTratamentoProposto?: string;
  responsavelTratamentoPropostoId?: number;
  responsavelTratamentoPropostoNome?: string;
  tratamentoPropostaStatus?: string;
  tratamentoPropostaEm?: string;
  tratamentoAprovadoPorId?: number;
  tratamentoAprovadoPorNome?: string;
  tratamentoAprovadoEm?: string;
  contencaoAcao?: string;
  contencaoResponsavelId?: number;
  contencaoResponsavelNome?: string;
  contencaoData?: string;
  contencaoNaoAplicavel?: boolean;
  contencaoOque?: string;
  contencaoQuem?: string;
  contencaoQuando?: string;
  contencaoConcluida?: boolean;
  contencaoDataConclusao?: string;
  contencaoAprovacaoStatus?: string | null;
  contencaoSolicitadoEm?: string;
  contencaoSolicitadoPorId?: number;
  contencaoSolicitadoPorNome?: string;
  contencaoAprovadoPorId?: number;
  contencaoAprovadoPorNome?: string;
  contencaoAprovadoEm?: string;
  contencaoRejeicaoObservacoes?: string;
  analiseCausaStatus?: string | null;
  analiseCausaSolicitadoEm?: string;
  analiseCausaSolicitadoPorId?: number;
  analiseCausaSolicitadoPorNome?: string;
  analiseCausaAprovadoPorId?: number;
  analiseCausaAprovadoPorNome?: string;
  analiseCausaAprovadoEm?: string;
  analiseCausaRejeicaoObservacoes?: string;
  acoesPlanoStatus?: string | null;
  acoesPlanoSolicitadoEm?: string;
  acoesPlanoSolicitadoPorId?: number;
  acoesPlanoSolicitadoPorNome?: string;
  acoesPlanoAprovadoPorId?: number;
  acoesPlanoAprovadoPorNome?: string;
  acoesPlanoAprovadoEm?: string;
  acoesPlanoRejeicaoObservacoes?: string;
  causaRaiz?: string;
  metodoCausa?: string;
  porque1?: string;
  porque2?: string;
  porque3?: string;
  porque4?: string;
  porque5?: string;
  porquesExtra?: string[];
  ishikawaMaterial?: string;
  disposicao?: string;
  disposicaoObservacao?: string;
  disposicaoAprovadaPorId?: number;
  disposicaoAprovadaPorNome?: string;
  disposicaoData?: string;
  verificacaoEficacia?: string;
  verificacaoData?: string;
  eficaciaDecisao?: string;
  eficaciaAtualizarRiscos?: boolean;
  eficaciaMudancasSgq?: string;
  encerradoPorId?: number;
  encerradoPorNome?: string;
  dataEncerramento?: string;
  dataUltimaAtualizacao?: string;
  isActive?: boolean;
  vencida?: boolean;
  etapaAtual?: string;
  prontaParaEficacia?: boolean;
  acoes?: NrcAcao[];
  anexos?: NrcAnexo[];
  auditorias?: NrcAuditoria[];
}

/** List/search projection returned by GET /api/nrc and /api/nrc/os/{id}. */
export interface NrcSummary {
  id?: number;
  numero?: string;
  status?: string;
  dataDeteccao?: string;
  origem?: string;
  severidade?: string;
  osId?: number;
  osNumero?: string;
  clienteNome?: string;
  prazoTratamento?: string;
  responsavelTratamentoId?: number;
  responsavelTratamentoNome?: string;
  vencida?: boolean;
  etapaAtual?: string;
  prontaParaEficacia?: boolean;
  dataEncerramento?: string;
  mostrarTratar?: boolean;
  aprovacaoEtapa?: string | null;
  aprovacaoStatus?: string | null;
  aprovacaoPorNome?: string | null;
  aprovacaoEm?: string | null;
}

export interface NrcDashboardTrendPoint {
  mes: string;
  abertas: number;
  encerradas: number;
}

export interface NrcDashboardCountItem {
  chave: string;
  total: number;
}

export interface NrcDashboard {
  abertas: number;
  emTratamento: number;
  vencidas: number;
  proximasVencimento: number;
  encerradasMes: number;
  total: number;
  etapaContencao: number;
  etapaCausa: number;
  etapaAcoes: number;
  etapaEficacia: number;
  tendenciaMensal?: NrcDashboardTrendPoint[];
  porSeveridade?: NrcDashboardCountItem[];
  porOrigem?: NrcDashboardCountItem[];
  taxaEncerramentoMes?: number | null;
  taxaEficacia?: number | null;
  leadTimeMedioDias?: number | null;
  custoConsolidado?: number | null;
  locaisDisponiveis?: string[];
}

export interface NrcDashboardParams {
  dataInicio?: string;
  dataFim?: string;
  meses?: number;
  origem?: string;
  localOcorrencia?: string;
  origemInterna?: boolean;
}

export interface NrcCatalog {
  locais: string[];
  requisitos: string[];
}

export const NRC_ORIGENS = [
  { value: 'OFICINA' },
  { value: 'ESTOQUE' },
  { value: 'INSPECAO' },
  { value: 'CLIENTE' },
  { value: 'AUDITORIA_INTERNA' }
];

export const NRC_TIPOS = [
  { value: 'PRODUTO' },
  { value: 'PROCESSO' },
  { value: 'DOCUMENTACAO' },
  { value: 'FORNECEDOR' },
  { value: 'AUDITORIA' }
];

export const NRC_SEVERIDADES = [
  { value: 'MENOR' },
  { value: 'MAIOR' },
  { value: 'CRITICA' }
];

export const NRC_STATUS = [
  { value: 'ABERTA' },
  { value: 'CONTENCAO' },
  { value: 'EM_ANALISE' },
  { value: 'EM_TRATAMENTO' },
  { value: 'ENCERRADA' }
];

export const NRC_DISPOSICOES = [
  { value: 'RETRABALHO' },
  { value: 'REPARO' },
  { value: 'SUCATEAMENTO' },
  { value: 'DEVOLUCAO' },
  { value: 'CONCESSAO' }
];

@Injectable({ providedIn: 'root' })
export class NrcService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private base = `${environment.apiUrl}/nrc`;

  search(params: {
    page?: number;
    size?: number;
    sort?: string;
    q?: string;
    status?: string;
    origem?: string;
    severidade?: string;
    osId?: number;
    dataInicio?: string;
    dataFim?: string;
    dataEncerramentoInicio?: string;
    dataEncerramentoFim?: string;
    emTratamento?: boolean | string;
    responsavelTratamentoId?: number;
    responsavelTratamentoOuHistoricoId?: number;
    excluirStatus?: string;
    prontaParaEficacia?: boolean;
    vencidas?: boolean | string;
    proximasVencimento?: boolean | string;
    etapaAtual?: string;
    localOcorrencia?: string;
    origemInterna?: boolean | string;
  }): Observable<NrcPage<NrcSummary>> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    });
    return this.http.get<NrcPage<NrcSummary>>(this.base, { params: hp });
  }

  dashboard(params: NrcDashboardParams = {}): Observable<NrcDashboard> {
    let hp = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') {
        hp = hp.set(k, String(v));
      }
    });
    return this.http.get<NrcDashboard>(`${this.base}/dashboard`, { params: hp });
  }

  catalog(): Observable<NrcCatalog> {
    return this.http.get<NrcCatalog>(`${this.base}/catalog`);
  }

  getById(id: number): Observable<Nrc> {
    return this.http.get<Nrc>(`${this.base}/${id}`);
  }

  /** Whether the user can open the workflow with editable steps (not read-only). */
  podeTratar(nrcId: number, usuarioId: number): Observable<{ allowed: boolean }> {
    const params = new HttpParams().set('usuarioId', usuarioId);
    return this.http.get<{ allowed: boolean }>(`${this.base}/${nrcId}/pode-tratar`, { params });
  }

  listByOs(osId: number): Observable<NrcSummary[]> {
    return this.http.get<NrcSummary[]>(`${this.base}/os/${osId}`);
  }

  /** NRC abertas/em tratamento por OS (chave = id PK da OS). */
  countsByOs(osIds: number[]): Observable<Record<number, number>> {
    if (!osIds.length) {
      return of({});
    }
    const params = new HttpParams().set('osIds', osIds.join(','));
    return this.http.get<Record<number, number>>(`${this.base}/counts-by-os`, { params });
  }

  create(nrc: Nrc, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    let hp = new HttpParams();
    if (usuarioId) hp = hp.set('usuarioId', usuarioId);
    if (usuarioNome) hp = hp.set('usuarioNome', usuarioNome);
    return this.http.post<Nrc>(this.base, nrc, { params: hp });
  }

  update(id: number, nrc: Partial<Nrc>, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    let hp = new HttpParams();
    if (usuarioId) hp = hp.set('usuarioId', usuarioId);
    if (usuarioNome) hp = hp.set('usuarioNome', usuarioNome);
    return this.http.put<Nrc>(`${this.base}/${id}`, nrc, { params: hp });
  }

  contencao(id: number, body: {
    contencaoNaoAplicavel?: boolean;
    contencaoOque?: string;
    contencaoQuem?: string;
    contencaoQuando?: string;
    contencaoAcao?: string;
    contencaoResponsavelId?: number;
    contencaoResponsavelNome?: string;
    concluirContencao?: boolean;
  }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/contencao`, body, usuarioId, usuarioNome);
  }

  solicitarAprovacaoContencao(id: number, body: {
    contencaoOque: string;
    contencaoQuem: string;
    contencaoQuando: string;
    contencaoResponsavelId?: number;
    contencaoResponsavelNome?: string;
  }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/contencao/solicitar-aprovacao`, body, usuarioId, usuarioNome);
  }

  aprovarContencao(id: number, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/contencao/aprovar`, {}, usuarioId, usuarioNome);
  }

  rejeitarContencao(id: number, body: { observacoes: string }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/contencao/rejeitar`, body, usuarioId, usuarioNome);
  }

  analise(id: number, body: Record<string, unknown>, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/analise`, body, usuarioId, usuarioNome);
  }

  solicitarAprovacaoAnaliseCausa(id: number, body: Record<string, unknown>, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/analise/solicitar-aprovacao`, body, usuarioId, usuarioNome);
  }

  aprovarAnaliseCausa(id: number, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/analise/aprovar`, {}, usuarioId, usuarioNome);
  }

  rejeitarAnaliseCausa(id: number, body: { observacoes: string }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/analise/rejeitar`, body, usuarioId, usuarioNome);
  }

  acoes(id: number, body: { acoes: NrcAcao[]; prazoTratamento?: string }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/acoes`, body, usuarioId, usuarioNome);
  }

  solicitarAprovacaoPlanoAcoes(id: number, body: { acoes: NrcAcao[]; prazoTratamento?: string }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/acoes/solicitar-aprovacao`, body, usuarioId, usuarioNome);
  }

  aprovarPlanoAcoes(id: number, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/acoes/aprovar`, {}, usuarioId, usuarioNome);
  }

  rejeitarPlanoAcoes(id: number, body: { observacoes: string }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/acoes/rejeitar`, body, usuarioId, usuarioNome);
  }

  solicitarApreciacaoQualidade(id: number, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    let hp = new HttpParams();
    if (usuarioId) hp = hp.set('usuarioId', usuarioId);
    if (usuarioNome) hp = hp.set('usuarioNome', usuarioNome);
    return this.http.post<Nrc>(`${this.base}/${id}/solicitar-apreciacao-qualidade`, {}, { params: hp });
  }

  propostaTratamento(id: number, body: {
    prazoTratamento?: string;
    responsavelTratamentoId?: number;
    responsavelTratamentoNome?: string;
  }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/proposta-tratamento`, body, usuarioId, usuarioNome);
  }

  aprovarTratamento(id: number, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/aprovar-tratamento`, {}, usuarioId, usuarioNome);
  }

  concluirAcao(id: number, acaoId: number, body: { evidenciaConclusao: string }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/acoes/${acaoId}/concluir`, body, usuarioId, usuarioNome);
  }

  assumirTratamento(id: number, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/assumir-tratamento`, {}, usuarioId, usuarioNome);
  }

  delegarTratamento(id: number, body: { responsavelTratamentoId: number }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/delegar-tratamento`, body, usuarioId, usuarioNome);
  }

  encerrar(id: number, body: {
    verificacaoEficacia: string;
    eficaciaDecisao: string;
    eficaciaAtualizarRiscos?: boolean;
    eficaciaMudancasSgq?: string;
  }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/encerrar`, body, usuarioId, usuarioNome);
  }

  salvarVerificacaoEficacia(id: number, body: {
    verificacaoEficacia: string;
    eficaciaDecisao: string;
    eficaciaAtualizarRiscos?: boolean;
    eficaciaMudancasSgq?: string;
  }, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    return this.workflowPut(`${this.base}/${id}/verificacao-eficacia`, body, usuarioId, usuarioNome);
  }

  auditoria(id: number): Observable<NrcAuditoria[]> {
    return this.http.get<NrcAuditoria[]>(`${this.base}/${id}/auditoria`);
  }

  relatorioUrl(id: number): string {
    const locale = encodeURIComponent(this.i18n.getCurrentLanguage());
    return `${this.base}/${id}/relatorio?locale=${locale}`;
  }

  fetchRelatorio(id: number): Observable<Blob> {
    const params = new HttpParams().set('locale', this.i18n.getCurrentLanguage());
    return this.http.get(`${this.base}/${id}/relatorio`, { params, responseType: 'blob' });
  }

  fetchAnexoBlob(nrcId: number, filename: string, inline = false): Observable<Blob> {
    let params = new HttpParams();
    if (inline) params = params.set('inline', 'true');
    return this.http.get(`${this.base}/${nrcId}/anexos/${encodeURIComponent(filename)}`, {
      params,
      responseType: 'blob'
    });
  }

  exportRelatoriosZip(ids: number[]): Observable<Blob> {
    const params = new HttpParams()
      .set('ids', ids.join(','))
      .set('locale', this.i18n.getCurrentLanguage());
    return this.http.get(`${this.base}/export-relatorios-zip`, { params, responseType: 'blob' });
  }

  delete(id: number, usuarioId?: number, usuarioNome?: string): Observable<void> {
    let hp = new HttpParams();
    if (usuarioId) hp = hp.set('usuarioId', usuarioId);
    if (usuarioNome) hp = hp.set('usuarioNome', usuarioNome);
    return this.http.delete<void>(`${this.base}/${id}`, { params: hp });
  }

  uploadAnexo(
    nrcId: number,
    file: File,
    descricao?: string,
    usuarioId?: number,
    usuarioNome?: string,
    categoria?: string
  ): Observable<NrcAnexo> {
    const formData = new FormData();
    formData.append('file', file);
    if (descricao) formData.append('descricao', descricao);
    if (categoria) formData.append('categoria', categoria);
    if (usuarioId) formData.append('usuarioId', usuarioId.toString());
    if (usuarioNome) formData.append('usuarioNome', usuarioNome);
    return this.http.post<NrcAnexo>(`${this.base}/${nrcId}/anexos`, formData);
  }

  deleteAnexo(nrcId: number, anexoId: number, usuarioId?: number, usuarioNome?: string): Observable<void> {
    let hp = new HttpParams();
    if (usuarioId) hp = hp.set('usuarioId', usuarioId);
    if (usuarioNome) hp = hp.set('usuarioNome', usuarioNome);
    return this.http.delete<void>(`${this.base}/${nrcId}/anexos/${anexoId}`, { params: hp });
  }

  anexoUrl(anexo: NrcAnexo, inline = false): string {
    const path = anexo.urlDownload || `/api/nrc/${anexo.nrcId}/anexos/${anexo.nomeArquivo}`;
    let url = path;
    if (typeof window !== 'undefined') {
      const proxied = window.location.port === '8081' || window.location.port === '80';
      if (!proxied) {
        const apiBase = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
        const origin = apiBase.replace(/\/api\/?$/, '');
        url = `${origin}${path}`;
      }
    }
    return inline ? `${url}${url.includes('?') ? '&' : '?'}inline=true` : url;
  }

  isImage(mime?: string): boolean {
    return !!mime && mime.startsWith('image/');
  }

  isPdf(mime?: string): boolean {
    return mime === 'application/pdf';
  }

  fileIcon(mime?: string): string {
    if (this.isImage(mime)) return 'pi pi-image';
    if (this.isPdf(mime)) return 'pi pi-file-pdf';
    if (mime?.includes('word') || mime?.includes('document')) return 'pi pi-file-word';
    if (mime?.includes('sheet') || mime?.includes('excel')) return 'pi pi-file-excel';
    return 'pi pi-file';
  }

  private workflowPut(url: string, body: unknown, usuarioId?: number, usuarioNome?: string): Observable<Nrc> {
    let hp = new HttpParams();
    if (usuarioId) hp = hp.set('usuarioId', usuarioId);
    if (usuarioNome) hp = hp.set('usuarioNome', usuarioNome);
    return this.http.put<Nrc>(url, body, { params: hp });
  }
}
