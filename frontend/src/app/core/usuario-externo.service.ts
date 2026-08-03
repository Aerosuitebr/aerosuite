import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, BehaviorSubject, tap, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { AuthService } from '../auth/auth.service';

export const EXTERNO_AUTH_REQUIRED = 'externo.auth.notAuthenticated';

export interface FuncionalidadeExterna {
  id: number;
  nome: string;
  descricao?: string;
  codigo: string;
  icone?: string;
  rota?: string;
  ordem: number;
  ativo: boolean;
}

export interface UsuarioExterno {
  id: number;
  nome: string;
  email: string;
  empresa?: string;
  telefone?: string;
  cargo?: string;
  observacoes?: string;
  fotoPerfil?: string;
  ativo: boolean;
  precisaTrocarSenha?: boolean;
  dataCadastro?: string;
  ultimoAcesso?: string;
  conviteEnviadoEm?: string;
  criadoPor?: number;
  criadoPorNome?: string;
  funcionalidades?: FuncionalidadeExterna[];
  totalOS?: number;
  totalDocumentos?: number;
}

export interface PropostaExternaResumo {
  id: number;
  numeroProposta?: string;
  status?: string;
  dataProposta?: string;
  validadeProposta?: string;
  produtoNome?: string;
  produtoPn?: string;
  valorTotalFinal?: number;
  totalGeralUsd?: number;
  osId?: number;
  osVinculo?: {
    id?: number;
    dtAbertura?: string;
    dataFechamento?: string;
    status?: string;
    clienteNome?: string;
  };
  podeAprovar?: boolean;
  podeRejeitar?: boolean;
  clienteDecisaoEm?: string;
  clienteDecisaoMotivo?: string;
  servicoExecutado?: string;
  prazoEntrega?: string;
  formaPagamento?: string;
  observacoes?: string;
  aditivos?: PropostaAditivoExterno[];
  anexos?: PropostaAnexoExterno[];
}

export interface PropostaAditivoExterno {
  id: number;
  propostaId?: number;
  descricao?: string;
  valor?: number;
  status?: string;
  podeAprovar?: boolean;
  podeRejeitar?: boolean;
}

export interface PropostaAnexoExterno {
  id: number;
  nomeArquivo?: string;
  tamanhoBytes?: number;
  createdAt?: string;
}

export interface OSExternaResumo {
  id: number;
  idOs: number;
  clienteNome: string;
  partNumber?: string;
  serialNumber?: string;
  tipoServico?: string;
  dtAbertura?: string;
  dataFechamento?: string;
  status: string;
  fabricanteNome?: string;
}

export interface OSExternaDetalhada extends OSExternaResumo {
  dataConclusaoServ?: string;
  modeloFcu?: string;
  tsn?: string;
  tso?: string;
  ataManual?: string;
  numRevisao?: string;
  dataRevManual?: string;
  obsConclusaoServ?: string;
  adsDas?: string;
  tituloAds?: string;
  tituloAfins?: string;
  boletinsServAfins?: string;
  documentos?: DocumentoExterno[];
  propostaId?: number;
  propostaNumero?: string;
}

export interface DocumentoExterno {
  id: number;
  nomeArquivo: string;
  descricao?: string;
  podeDownload: boolean;
  dataExpiracao?: string;
  dataConcessao?: string;
  visualizacoes: number;
  ultimoAcesso?: string;
  osFileId?: number;
  tpFileId?: number;
  tipoArquivo?: string;
  tamanhoArquivo?: number;
  isAvulso?: boolean; // Indica se é um documento avulso (pasta diversos)
}

export interface LoginExternoResponse {
  token: string;
  user: UsuarioExterno;
  funcionalidades: FuncionalidadeExterna[];
  isExternal: boolean;
}

export interface TenantLoginOption {
  id: number;
  codigo: string;
  nome: string;
  label?: string;
  criadoEm?: string;
}

export interface SearchResult {
  content: UsuarioExterno[];
  totalElements: number;
}

@Injectable({
  providedIn: 'root'
})
export class UsuarioExternoService {
  private readonly API_URL = environment.apiUrl;
  private readonly TOKEN_KEY = 'aerosuite_external_token';
  private readonly USER_KEY = 'aerosuite_external_user';
  private readonly FUNCIONALIDADES_KEY = 'aerosuite_external_funcionalidades';
  private readonly TENANT_CODIGO_KEY = 'aerosuite_externo_tenant_codigo';

  private currentUserSubject = new BehaviorSubject<UsuarioExterno | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private readonly injector = inject(Injector);

  constructor(private http: HttpClient) {
    this.loadStoredUser();
  }

  // ========================================
  // CRUD de Usuário Externo (Admin)
  // ========================================

  list(params?: { page?: number; size?: number; q?: string; ativo?: boolean }): Observable<SearchResult> {
    let httpParams = new HttpParams();
    if (params?.page !== undefined) httpParams = httpParams.set('page', params.page.toString());
    if (params?.size !== undefined) httpParams = httpParams.set('size', params.size.toString());
    if (params?.q) httpParams = httpParams.set('q', params.q);
    if (params?.ativo !== undefined) httpParams = httpParams.set('ativo', params.ativo.toString());

    return this.http.get<SearchResult>(`${this.API_URL}/usuarios-externos`, { params: httpParams });
  }

  getById(id: number): Observable<UsuarioExterno> {
    return this.http.get<UsuarioExterno>(`${this.API_URL}/usuarios-externos/${id}`);
  }

  create(usuario: Partial<UsuarioExterno>, criadoPor: number): Observable<UsuarioExterno> {
    return this.http.post<UsuarioExterno>(`${this.API_URL}/usuarios-externos?criadoPor=${criadoPor}`, usuario);
  }

  update(id: number, usuario: Partial<UsuarioExterno>): Observable<UsuarioExterno> {
    return this.http.put<UsuarioExterno>(`${this.API_URL}/usuarios-externos/${id}`, usuario);
  }

  delete(id: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/usuarios-externos/${id}`);
  }

  activate(id: number): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios-externos/${id}/ativar`, {});
  }

  // ========================================
  // Funcionalidades
  // ========================================

  getAllFuncionalidades(): Observable<FuncionalidadeExterna[]> {
    return this.http.get<FuncionalidadeExterna[]>(`${this.API_URL}/usuarios-externos/funcionalidades`);
  }

  getFuncionalidadesUsuario(usuarioId: number): Observable<FuncionalidadeExterna[]> {
    return this.http.get<FuncionalidadeExterna[]>(`${this.API_URL}/usuarios-externos/${usuarioId}/funcionalidades`);
  }

  atualizarFuncionalidades(usuarioId: number, funcionalidadeIds: number[], concedidoPor: number): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios-externos/${usuarioId}/funcionalidades`, {
      funcionalidadeIds,
      concedidoPor
    });
  }

  // ========================================
  // Ordens de Serviço
  // ========================================

  getOSsUsuario(usuarioId: number): Observable<OSExternaResumo[]> {
    return this.http.get<OSExternaResumo[]>(`${this.API_URL}/usuarios-externos/${usuarioId}/os`);
  }

  concederAcessoOS(usuarioId: number, osId: number, concedidoPor: number, observacoes?: string): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios-externos/${usuarioId}/os/${osId}`, {
      concedidoPor,
      observacoes
    });
  }

  revogarAcessoOS(usuarioId: number, osId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/usuarios-externos/${usuarioId}/os/${osId}`);
  }

  revogarAcessoOSCompleto(usuarioId: number, osId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/usuarios-externos/${usuarioId}/os/${osId}/completo`);
  }

  // ========================================
  // Documentos
  // ========================================

  getDocumentosUsuario(usuarioId: number): Observable<DocumentoExterno[]> {
    return this.http.get<DocumentoExterno[]>(`${this.API_URL}/usuarios-externos/${usuarioId}/documentos`);
  }

  concederAcessoDocumento(usuarioId: number, dados: {
    osFileId?: number;
    tpFileId?: number;
    nomeArquivo: string;
    descricao?: string;
    podeDownload?: boolean;
    dataExpiracao?: string;
    concedidoPor: number;
  }): Observable<any> {
    return this.http.post(`${this.API_URL}/usuarios-externos/${usuarioId}/documentos`, dados);
  }

  revogarAcessoDocumento(usuarioId: number, documentoId: number): Observable<any> {
    return this.http.delete(`${this.API_URL}/usuarios-externos/${usuarioId}/documentos/${documentoId}`);
  }

  // ========================================
  // Autenticação (Usuário Externo)
  // ========================================

  getStoredTenantCodigo(): string {
    return localStorage.getItem(this.TENANT_CODIGO_KEY) ?? 'default';
  }

  setStoredTenantCodigo(codigo: string): void {
    if (codigo?.trim()) {
      localStorage.setItem(this.TENANT_CODIGO_KEY, codigo.trim().toLowerCase());
    }
  }

  listLoginTenants(email: string): Observable<TenantLoginOption[]> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const q = encodeURIComponent(email.trim());
    return this.http.get<TenantLoginOption[]>(`${apiUrl}/auth-externo/login-tenants?email=${q}`);
  }

  login(email: string, password: string, tenantCodigo?: string): Observable<LoginExternoResponse> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const codigo = (tenantCodigo ?? '').trim();
    const body = { email, password, tenantCodigo: codigo || undefined };
    return this.http.post<LoginExternoResponse>(`${apiUrl}/auth-externo/login`, body).pipe(
      tap(response => {
        try {
          this.injector.get(AuthService).clearSessionSilently();
        } catch {
          localStorage.removeItem('aerosuite_token');
          localStorage.removeItem('aerosuite_user');
        }
        if (codigo) {
          this.setStoredTenantCodigo(codigo);
        }
        localStorage.setItem(this.TOKEN_KEY, response.token);
        localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
        localStorage.setItem(this.FUNCIONALIDADES_KEY, JSON.stringify(response.funcionalidades));
        this.currentUserSubject.next(response.user);
      }),
      catchError(error => {
        console.error('External login error:', error);
        return throwError(() => error);
      })
    );
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    localStorage.removeItem(this.FUNCIONALIDADES_KEY);
    this.currentUserSubject.next(null);
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): UsuarioExterno | null {
    return this.currentUserSubject.value;
  }

  getFuncionalidades(): FuncionalidadeExterna[] {
    const stored = localStorage.getItem(this.FUNCIONALIDADES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  hasAccessTo(codigo: string): boolean {
    const funcionalidades = this.getFuncionalidades();
    return funcionalidades.some(f => f.codigo === codigo && f.ativo);
  }

  private loadStoredUser(): void {
    const userStr = localStorage.getItem(this.USER_KEY);
    const token = this.getToken();
    
    if (userStr && token && !this.isTokenExpired(token)) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (error) {
        console.error('Failed to load external user from localStorage:', error);
        this.logout();
      }
    }
  }

  private isTokenExpired(token: string): boolean {
    try {
      const tokenData = atob(token);
      const parts = tokenData.split(':');
      if (parts.length >= 4 && parts[0] === 'EXT') {
        // Formato: EXT:{userId}:{email}:{tenantId}:{timestampMs}
        const tokenTime = parseInt(parts[parts.length - 1], 10);
        if (Number.isNaN(tokenTime) || tokenTime <= 0) {
          return true;
        }
        const currentTime = Date.now();
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return currentTime - tokenTime > twentyFourHours;
      }
      return true;
    } catch {
      return true;
    }
  }

  // ========================================
  // API para usuário externo logado
  // ========================================

  getMinhasOS(): Observable<OSExternaResumo[]> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get<OSExternaResumo[]>(`${apiUrl}/auth-externo/me/${user.id}/os`);
  }

  getOSDetalhada(osId: number): Observable<OSExternaDetalhada> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get<OSExternaDetalhada>(`${apiUrl}/auth-externo/me/${user.id}/os/${osId}`);
  }

  getMeusDocumentos(): Observable<DocumentoExterno[]> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get<DocumentoExterno[]>(`${apiUrl}/auth-externo/me/${user.id}/documentos`);
  }

  getMinhasPropostas(): Observable<PropostaExternaResumo[]> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get<PropostaExternaResumo[]>(`${apiUrl}/auth-externo/me/${user.id}/propostas`);
  }

  getPropostaExterna(propostaId: number): Observable<PropostaExternaResumo> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get<PropostaExternaResumo>(`${apiUrl}/auth-externo/me/${user.id}/propostas/${propostaId}`);
  }

  aprovarPropostaExterna(propostaId: number, motivo?: string): Observable<PropostaExternaResumo> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post<PropostaExternaResumo>(
      `${apiUrl}/auth-externo/me/${user.id}/propostas/${propostaId}/aprovar`,
      { motivo: motivo ?? '' }
    );
  }

  rejeitarPropostaExterna(propostaId: number, motivo: string): Observable<PropostaExternaResumo> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post<PropostaExternaResumo>(
      `${apiUrl}/auth-externo/me/${user.id}/propostas/${propostaId}/rejeitar`,
      { motivo }
    );
  }

  getPropostaImpressaoHtml(propostaId: number): Observable<string> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get(`${apiUrl}/auth-externo/me/${user.id}/propostas/${propostaId}/imprimir`, {
      responseType: 'text'
    });
  }

  solicitarAditivo(propostaId: number, descricao: string, valor?: number): Observable<PropostaAditivoExterno> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post<PropostaAditivoExterno>(
      `${apiUrl}/auth-externo/me/${user.id}/propostas/${propostaId}/aditivos`,
      { descricao, valor }
    );
  }

  decidirAditivo(propostaId: number, aditivoId: number, aprovar: boolean, motivo?: string): Observable<PropostaAditivoExterno> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const path = aprovar ? 'aprovar' : 'rejeitar';
    return this.http.post<PropostaAditivoExterno>(
      `${apiUrl}/auth-externo/me/${user.id}/propostas/${propostaId}/aditivos/${aditivoId}/${path}`,
      { motivo: motivo ?? '' }
    );
  }

  enviarAnexoProposta(propostaId: number, file: File): Observable<PropostaAnexoExterno> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const fd = new FormData();
    fd.append('file', file);
    return this.http.post<PropostaAnexoExterno>(
      `${apiUrl}/auth-externo/me/${user.id}/propostas/${propostaId}/anexos`,
      fd
    );
  }

  getMinhasFuncionalidades(): Observable<FuncionalidadeExterna[]> {
    const user = this.getCurrentUser();
    if (!user) return throwError(() => new Error(EXTERNO_AUTH_REQUIRED));
    
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get<FuncionalidadeExterna[]>(`${apiUrl}/auth-externo/me/${user.id}/funcionalidades`);
  }

  // Reset de senha
  changePasswordForNewUser(email: string, senhaTemporaria: string, novaSenha: string): Observable<any> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post(`${apiUrl}/auth-externo/change-password-new-user`, {
      email,
      senhaTemporaria,
      novaSenha
    });
  }
}
