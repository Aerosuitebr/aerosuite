import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface BlingConnectionStatus {
  enabled: boolean;
  configured: boolean;
  connected?: boolean;
  oauthConfigured?: boolean;
  ok?: boolean;
  message?: string;
  connectedAt?: string;
  scopeChecks?: BlingScopeCheck[];
}

export interface BlingScopeCheck {
  resource: string;
  label: string;
  ok: boolean;
  httpStatus?: number;
  message?: string;
  blingAppPermission?: string;
}

export interface BlingScopesStatus {
  allOk: boolean;
  message?: string;
  checks: BlingScopeCheck[];
  requiredBlingAppPermissions: string[];
  reconnectHint?: string;
}

export interface BlingWebhookHomologation {
  success?: boolean;
  message?: string;
  webhookEnabled?: boolean;
  syncEnabled?: boolean;
  companyIdMapped?: boolean;
  webhookUrl?: string;
  webhookUrlTenant?: string;
  tenantCodigo?: string;
  blingCompanyId?: string;
  lastWebhookAt?: string;
  pendingJobs?: number;
  probeAccepted?: boolean;
  steps?: string[];
}

export interface BlingBootstrapResult {
  success: boolean;
  message?: string;
  scopes?: BlingScopesStatus;
  blingContatoId?: number;
  blingContatoNome?: string;
  clientePropostaId?: number;
  webhookHomologation?: BlingWebhookHomologation;
  steps?: string[];
}

export interface BlingTenantConnection {
  platformEnabled: boolean;
  oauthConfigured: boolean;
  connected: boolean;
  linked?: boolean;
  tokenOperational?: boolean;
  tokenIssue?: string;
  canManage: boolean;
  connectedAt?: string;
  blingCompanyName?: string;
  blingCompanyId?: string;
  message?: string;
}

export interface BlingNfeReadinessCheck {
  code: string;
  label: string;
  ok: boolean;
  blocking?: boolean;
  message?: string;
  fixHint?: string;
}

export interface BlingNfeReadiness {
  ready: boolean;
  checks: BlingNfeReadinessCheck[];
  blockers?: string[];
  warnings?: string[];
  message?: string;
}

export interface BlingSyncStatus {
  pendingJobs: number;
  failedJobs: number;
  deadJobs: number;
  mappedContacts: number;
  linkedPedidos?: number;
  nfeRegistros?: number;
  lastWebhookAt?: string;
  message?: string;
}

export interface BlingSyncJobView {
  id: number;
  jobType: string;
  status: string;
  attempts: number;
  maxAttempts: number;
  lastError?: string;
  createdAt?: string;
  processedAt?: string;
  eventType?: string;
  resourceId?: string;
}

export interface BlingDeadJobsActionResult {
  affected: number;
  message?: string;
}

export interface BlingPropostaPedidoView {
  linked: boolean;
  propostaComercialId?: number;
  blingPedidoId?: number;
  blingPedidoNumero?: string;
  blingSituacao?: string;
  pushedAt?: string;
  lastSyncAt?: string;
  message?: string;
}

export interface BlingNfeRegistro {
  blingNfeId?: number;
  numero?: string;
  chaveAcesso?: string;
  situacao?: string;
  danfeUrl?: string;
  emittedAt?: string;
}

export interface BlingPropostaNfeList {
  items: BlingNfeRegistro[];
}

export interface BlingFiscalConfig {
  tenantId?: number;
  cfopPadrao?: string;
  serieNfe?: string;
  naturezaOperacao?: string;
  ncmPadrao?: string;
  aliquotaIcms?: number;
  aliquotaPis?: number;
  aliquotaCofins?: number;
  autoOsOnPedido?: boolean;
  autoEmitirNfe?: boolean;
  certificadoConfigurado?: boolean;
  certificadoTipo?: string;
  certificadoNome?: string;
  certificadoValidoAte?: string;
  certificadoUploadedAt?: string;
  message?: string;
}

export interface BlingFiscalConfigUpdate {
  cfopPadrao?: string;
  serieNfe?: string;
  naturezaOperacao?: string;
  ncmPadrao?: string;
  aliquotaIcms?: number;
  aliquotaPis?: number;
  aliquotaCofins?: number;
  autoOsOnPedido?: boolean;
  autoEmitirNfe?: boolean;
}

export interface BlingNfeEmitResult {
  blingNfeId?: number;
  numero?: string;
  situacao?: string;
  chaveAcesso?: string;
  danfeUrl?: string;
  propostaComercialId?: number;
  created?: boolean;
  message?: string;
}

export interface BlingPropostaFluxoEvento {
  id?: number;
  etapa?: string;
  status?: string;
  mensagem?: string;
  detalhe?: string;
  osId?: number;
  createdAt?: string;
}

export interface BlingPropostaFluxoPasso {
  codigo?: string;
  status?: string;
  titulo?: string;
  detalhe?: string;
  updatedAt?: string;
}

export interface BlingPropostaFluxoView {
  propostaComercialId?: number;
  osId?: number;
  pedidoVinculado?: boolean;
  osGerada?: boolean;
  osConcluida?: boolean;
  nfeEmitida?: boolean;
  automacaoPendente?: boolean;
  automacaoComErro?: boolean;
  aguardandoConclusaoOs?: boolean;
  automacaoMotivo?: string;
  retryDisponivel?: boolean;
  ultimoErro?: string;
  passos?: BlingPropostaFluxoPasso[];
  eventos?: BlingPropostaFluxoEvento[];
}

export interface BlingFluxoRetryResult {
  success?: boolean;
  message?: string;
  fluxo?: BlingPropostaFluxoView;
}

export interface BlingImportClienteResult {
  cliente: import('./cliente-proposta.service').ClienteProposta;
  blingContatoId: number;
  created: boolean;
  linked: boolean;
  message?: string;
}

export interface BlingOAuthStart {
  authorizationUrl: string;
}

export interface BlingContact {
  id: number;
  nome?: string;
  email?: string;
  telefone?: string;
  cnpjCpf?: string;
  cidade?: string;
  uf?: string;
  endereco?: string;
}

export interface BlingContactPage {
  items: BlingContact[];
  enabled: boolean;
  configured: boolean;
  message?: string;
}

export interface BlingProductFiscalSyncResult {
  blingProductId: number;
  ncm?: string;
  unidade?: string;
  persisted: boolean;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class BlingApiService {
  private apiBase(): string {
    return environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
  }

  status(refresh = false): Observable<BlingConnectionStatus> {
    const params = refresh ? new HttpParams().set('refresh', 'true') : undefined;
    return this.http.get<BlingConnectionStatus>(`${this.apiBase()}/integracoes/bling/status`, { params });
  }

  getScopes(refresh = false): Observable<BlingScopesStatus> {
    const params = refresh ? new HttpParams().set('refresh', 'true') : undefined;
    return this.http.get<BlingScopesStatus>(`${this.apiBase()}/integracoes/bling/scopes`, { params });
  }

  bootstrapHomologacao(): Observable<BlingBootstrapResult> {
    return this.http.post<BlingBootstrapResult>(`${this.apiBase()}/integracoes/bling/bootstrap/homologacao`, {});
  }

  webhookHomologacao(): Observable<BlingWebhookHomologation> {
    return this.http.post<BlingWebhookHomologation>(`${this.apiBase()}/integracoes/bling/homologacao/webhook`, {});
  }

  getConnection(): Observable<BlingTenantConnection> {
    return this.http.get<BlingTenantConnection>(`${this.apiBase()}/integracoes/bling/connection`);
  }

  startOAuth(): Observable<BlingOAuthStart> {
    return this.http.post<BlingOAuthStart>(`${this.apiBase()}/integracoes/bling/oauth/start`, {});
  }

  disconnect(): Observable<void> {
    return this.http.delete<void>(`${this.apiBase()}/integracoes/bling/connection`);
  }

  getSyncStatus(): Observable<BlingSyncStatus> {
    return this.http.get<BlingSyncStatus>(`${this.apiBase()}/integracoes/bling/sync/status`);
  }

  getNfeReadiness(refresh = false): Observable<BlingNfeReadiness> {
    const params = refresh ? new HttpParams().set('refresh', 'true') : undefined;
    return this.http.get<BlingNfeReadiness>(`${this.apiBase()}/integracoes/bling/nfe/readiness`, { params });
  }

  listDeadSyncJobs(): Observable<BlingSyncJobView[]> {
    return this.http.get<BlingSyncJobView[]>(`${this.apiBase()}/integracoes/bling/sync/jobs/dead`);
  }

  reprocessDeadSyncJob(jobId: number): Observable<BlingDeadJobsActionResult> {
    return this.http.post<BlingDeadJobsActionResult>(
      `${this.apiBase()}/integracoes/bling/sync/jobs/${jobId}/reprocess`,
      {}
    );
  }

  discardDeadSyncJob(jobId: number): Observable<BlingDeadJobsActionResult> {
    return this.http.delete<BlingDeadJobsActionResult>(`${this.apiBase()}/integracoes/bling/sync/jobs/${jobId}`);
  }

  reprocessAllDeadSyncJobs(): Observable<BlingDeadJobsActionResult> {
    return this.http.post<BlingDeadJobsActionResult>(
      `${this.apiBase()}/integracoes/bling/sync/jobs/dead/reprocess-all`,
      {}
    );
  }

  discardAllDeadSyncJobs(): Observable<BlingDeadJobsActionResult> {
    return this.http.delete<BlingDeadJobsActionResult>(`${this.apiBase()}/integracoes/bling/sync/jobs/dead`);
  }

  importContactAsCliente(blingContatoId: number): Observable<BlingImportClienteResult> {
    return this.http.post<BlingImportClienteResult>(
      `${this.apiBase()}/integracoes/bling/contatos/${blingContatoId}/import-cliente`,
      {}
    );
  }

  linkContact(blingContatoId: number, clientePropostaId: number): Observable<import('./cliente-proposta.service').ClienteProposta> {
    return this.http.post<import('./cliente-proposta.service').ClienteProposta>(
      `${this.apiBase()}/integracoes/bling/contatos/${blingContatoId}/link/${clientePropostaId}`,
      {}
    );
  }

  searchContacts(
    pesquisaOrOpts: string | { pesquisa?: string; numeroDocumento?: string; nome?: string; limit?: number },
    limit = 20
  ): Observable<BlingContactPage> {
    let params = new HttpParams();
    if (typeof pesquisaOrOpts === 'string') {
      if (pesquisaOrOpts.trim()) {
        params = params.set('pesquisa', pesquisaOrOpts.trim());
      }
      params = params.set('limit', String(limit));
    } else {
      const opts = pesquisaOrOpts;
      if (opts.pesquisa?.trim()) {
        params = params.set('pesquisa', opts.pesquisa.trim());
      }
      if (opts.numeroDocumento?.trim()) {
        params = params.set('numeroDocumento', opts.numeroDocumento.trim());
      }
      if (opts.nome?.trim()) {
        params = params.set('nome', opts.nome.trim());
      }
      params = params.set('limit', String(opts.limit ?? limit));
    }
    return this.http.get<BlingContactPage>(`${this.apiBase()}/integracoes/bling/contatos`, { params });
  }

  syncProductFiscal(blingProductId: number): Observable<BlingProductFiscalSyncResult> {
    return this.http.post<BlingProductFiscalSyncResult>(
      `${this.apiBase()}/integracoes/bling/produtos/${blingProductId}/fiscal`,
      {}
    );
  }

  getPropostaPedido(propostaId: number): Observable<BlingPropostaPedidoView> {
    return this.http.get<BlingPropostaPedidoView>(
      `${this.apiBase()}/integracoes/bling/propostas/${propostaId}/pedido`
    );
  }

  createPropostaPedido(propostaId: number): Observable<BlingPropostaPedidoView> {
    return this.http.post<BlingPropostaPedidoView>(
      `${this.apiBase()}/integracoes/bling/propostas/${propostaId}/pedido`,
      {}
    );
  }

  listPropostaNfe(propostaId: number): Observable<BlingPropostaNfeList> {
    return this.http.get<BlingPropostaNfeList>(
      `${this.apiBase()}/integracoes/bling/propostas/${propostaId}/nfe`
    );
  }

  emitirPropostaNfe(propostaId: number): Observable<BlingNfeEmitResult> {
    return this.http.post<BlingNfeEmitResult>(
      `${this.apiBase()}/integracoes/bling/propostas/${propostaId}/nfe/emitir`,
      {}
    );
  }

  getPropostaFluxo(propostaId: number): Observable<BlingPropostaFluxoView> {
    return this.http.get<BlingPropostaFluxoView>(
      `${this.apiBase()}/integracoes/bling/propostas/${propostaId}/fluxo`
    );
  }

  getOsFluxo(osId: number): Observable<BlingPropostaFluxoView> {
    return this.http.get<BlingPropostaFluxoView>(`${this.apiBase()}/integracoes/bling/os/${osId}/fluxo`);
  }

  retryPropostaFluxo(propostaId: number): Observable<BlingFluxoRetryResult> {
    return this.http.post<BlingFluxoRetryResult>(
      `${this.apiBase()}/integracoes/bling/propostas/${propostaId}/fluxo/retry`,
      {}
    );
  }

  getFiscalConfig(): Observable<BlingFiscalConfig> {
    return this.http.get<BlingFiscalConfig>(`${this.apiBase()}/integracoes/bling/fiscal-config`);
  }

  updateFiscalConfig(body: BlingFiscalConfigUpdate): Observable<BlingFiscalConfig> {
    return this.http.put<BlingFiscalConfig>(`${this.apiBase()}/integracoes/bling/fiscal-config`, body);
  }

  uploadCertificado(file: File, password: string, tipo: 'A1' | 'A3'): Observable<BlingFiscalConfig> {
    const form = new FormData();
    form.append('file', file);
    form.append('password', password);
    form.append('tipo', tipo);
    return this.http.post<BlingFiscalConfig>(`${this.apiBase()}/integracoes/bling/fiscal-config/certificado`, form);
  }

  removeCertificado(): Observable<BlingFiscalConfig> {
    return this.http.delete<BlingFiscalConfig>(`${this.apiBase()}/integracoes/bling/fiscal-config/certificado`);
  }

  constructor(private http: HttpClient) {}
}
