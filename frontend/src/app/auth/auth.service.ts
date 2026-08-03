import { Injectable, inject, Injector } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, tap, catchError, of, throwError, map, shareReplay } from 'rxjs';
import { Router } from '@angular/router';
import { environment } from '../../environments/environment';
import { extractUsuarioFotoFilename, isEphemeralUsuarioFotoUrl } from '../core/usuario-foto.util';
import { TenantFeatureService } from '../core/tenant-feature.service';
import { UsuarioExternoService } from '../core/usuario-externo.service';
import { SistemaEmpresaService } from '../core/sistema-empresa.service';
import { MenuService } from '../core/menu.service';
import { Funcionalidade } from '../core/funcionalidade.service';
import { shouldSkipSessionHydrateOnStartup } from './public-auth-routes.util';

/** Corpo de erro JSON retornado por `/api/auth/login` e endpoints MFA. */
export interface AuthApiErrorBody {
  code?: string;
  message?: string;
  error?: string;
  mfaSetupToken?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
  /** Código da organização (tenant.codigo); obrigatório se o e-mail existir em mais de um tenant. */
  tenantCodigo?: string;
  /** Código TOTP quando MFA exigido. */
  totpCode?: string;
}

export interface MfaSetupResponse {
  secret: string;
  otpAuthUri: string;
  enabled: boolean;
}

export interface TenantLoginOption {
  id: number;
  codigo: string;
  nome: string;
  label?: string;
  criadoEm?: string;
}

export interface LoginResponse {
  token: string;
  message?: string;
  user: {
    id: number;
    tenantId?: number;
    tenantCodigo?: string;
    tenantNome?: string;
    email: string;
    nome: string;
    role: string;
    fotoPerfil?: string;
    ultimoAcesso?: string;
    dataCadastro?: string;
    precisaTrocarSenha?: boolean;
    funcionalidadeCodigos?: string[];
    menuFuncionalidades?: Funcionalidade[];
    modulosHabilitados?: string[];
    tenantFeatures?: string[];
    lgpdAceitePendente?: boolean;
    billingStatus?: string;
    perfil?: {
      id: number;
      nome: string;
      descricao: string;
      codigo: string;
    };
  };
}

export interface User {
  id: number;
  /** Tenant lógico (claim JWT `tid` / `usuario.tenant_id`). */
  tenantId?: number;
  /** Código da organização (tenant.codigo). */
  tenantCodigo?: string;
  tenantNome?: string;
  email: string;
  nome: string;
  role: string;
  fotoPerfil?: string;
  ultimoAcesso?: string;
  dataCadastro?: string;
  precisaTrocarSenha?: boolean;
  /** Códigos do perfil + delegações (login); ausente em sessões antigas até novo login. */
  funcionalidadeCodigos?: string[];
  /** Menu efetivo pré-calculado no login (evita GET /meu-menu na abertura). */
  menuFuncionalidades?: Funcionalidade[];
  modulosHabilitados?: string[];
  /** Feature flags finas do tenant (customização). */
  tenantFeatures?: string[];
  lgpdAceitePendente?: boolean;
  billingStatus?: string;
  perfil?: {
    id: number;
    nome: string;
    descricao: string;
    codigo: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly API_URL = ''; // Use relative URL to work with proxy
  private readonly TOKEN_KEY = 'aerosuite_token';
  private readonly USER_KEY = 'aerosuite_user';

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  /** Evita chamadas paralelas duplicadas a GET /auth/me na abertura do layout. */
  private sessionHydrate$?: Observable<User | null>;
  /** Login acabou de preencher user+permissões — não repetir GET /auth/me no layout. */
  private sessionFreshFromLogin = false;
  private readonly injector = inject(Injector);

  constructor(
    private http: HttpClient,
    private router: Router,
    private tenantFeatureService: TenantFeatureService
  ) {
    this.loadStoredUser();
  }

  private readonly TENANT_CODIGO_KEY = 'aerosuite_tenant_codigo';

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
    return this.http.get<TenantLoginOption[]>(`${apiUrl}/auth/login-tenants?email=${q}`);
  }

  login(email: string, password: string, tenantCodigo?: string, totpCode?: string): Observable<LoginResponse> {
    const codigo = (tenantCodigo ?? '').trim();
    const code = (totpCode ?? '').trim();
    const loginData: LoginRequest = {
      email,
      password,
      tenantCodigo: codigo || undefined,
      totpCode: code || undefined
    };
    // Usar URL absoluta diretamente já que o backend está acessível
    // Usar URL dinâmica para sempre detectar o IP correto baseado na URL atual
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const loginUrl = `${apiUrl}/auth/login`;
    
    
    // Simplificar completamente - apenas fazer login e retornar
    // Não fazer segunda requisição para evitar travamento
    return this.http.post<LoginResponse>(loginUrl, loginData, {
      headers: {
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => {

        if (response.user?.tenantCodigo) {
          this.setStoredTenantCodigo(response.user.tenantCodigo);
        } else if (loginData.tenantCodigo) {
          this.setStoredTenantCodigo(loginData.tenantCodigo);
        }
        this.applySessionFromLoginResponse(response);
      }),
      catchError(error => {
        console.error('AuthService: erro no login:', error);
        return throwError(() => error);
      })
    );
  }

  mfaSetup(setupToken: string): Observable<MfaSetupResponse> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post<MfaSetupResponse>(`${apiUrl}/auth/mfa/setup`, {}, {
      headers: {
        Authorization: `Bearer ${setupToken}`,
        'Content-Type': 'application/json'
      }
    });
  }

  mfaConfirm(setupToken: string, totpCode: string): Observable<LoginResponse> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post<LoginResponse>(`${apiUrl}/auth/mfa/confirm`, { totpCode }, {
      headers: {
        Authorization: `Bearer ${setupToken}`,
        'Content-Type': 'application/json'
      }
    }).pipe(
      tap(response => this.applySessionFromLoginResponse(response))
    );
  }

  logout(): void {
    this.clearAuthData();
    this.router.navigate(['/login']);
  }

  /** Remove sessão interna sem redirecionar (ex.: login no portal externo). */
  clearSessionSilently(): void {
    this.clearAuthData();
  }

  /** Encerra sessão externa ao autenticar usuário interno (evita conflito no interceptor). */
  private clearExternalSession(): void {
    try {
      this.injector.get(UsuarioExternoService).logout();
    } catch {
      localStorage.removeItem('aerosuite_external_token');
      localStorage.removeItem('aerosuite_external_user');
      localStorage.removeItem('aerosuite_external_funcionalidades');
    }
  }

  isAuthenticated(): boolean {
    const token = this.getToken();
    return !!token && !this.isTokenExpired(token);
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /** Suprimento, Administrador ou Diretor podem marcar coluna Pago nos itens da Solicitação de Troca Eventual na OS. */
  podeMarcarPagoTrocasOs(): boolean {
    const c = this.getCurrentUser()?.perfil?.codigo?.trim()?.toUpperCase();
    return c === 'ADMIN' || c === 'DIRETOR' || c === 'SUPRIMENTO';
  }

  /** Suprimento, Comercial, Admin, Diretor e Mecânico: recebem modais globais de Solicitação de Troca Eventual. */
  podeReceberNotificacaoDeficitTrocasOs(): boolean {
    const c = this.getCurrentUser()?.perfil?.codigo?.trim()?.toUpperCase();
    return c === 'ADMIN' || c === 'DIRETOR' || c === 'SUPRIMENTO' || c === 'COMERCIAL' || c === 'MECANICO';
  }

  updateCurrentUser(user: User): void {
    const normalized = this.withNormalizedFoto(user);
    const prev = this.currentUserSubject.value;
    if (prev && this.isSameUserPayload(prev, normalized)) {
      return;
    }
    this.currentUserSubject.next(normalized);
    localStorage.setItem(this.USER_KEY, JSON.stringify(normalized));
  }

  /** Evita reemitir sessão idêntica (ex.: GET /auth/me após login já completo). */
  private isSameUserPayload(a: User, b: User): boolean {
    if (a.id !== b.id) {
      return false;
    }
    const ac = [...(a.funcionalidadeCodigos ?? [])].sort().join('|');
    const bc = [...(b.funcionalidadeCodigos ?? [])].sort().join('|');
    if (ac !== bc) {
      return false;
    }
    const af = [...(a.tenantFeatures ?? [])].sort().join('|');
    const bf = [...(b.tenantFeatures ?? [])].sort().join('|');
    if (af !== bf) {
      return false;
    }
    return (a.fotoPerfil ?? '') === (b.fotoPerfil ?? '')
      && (a.lgpdAceitePendente ?? false) === (b.lgpdAceitePendente ?? false)
      && (a.precisaTrocarSenha ?? false) === (b.precisaTrocarSenha ?? false)
      && (a.nome ?? '') === (b.nome ?? '')
      && (a.email ?? '') === (b.email ?? '');
  }

  private withNormalizedFoto(user: User): User {
    if (!user.fotoPerfil) {
      return user;
    }
    if (isEphemeralUsuarioFotoUrl(user.fotoPerfil)) {
      const { fotoPerfil: _removed, ...rest } = user;
      return rest as User;
    }
    const filename = extractUsuarioFotoFilename(user.fotoPerfil);
    if (!filename || filename === user.fotoPerfil) {
      return user;
    }
    return { ...user, fotoPerfil: filename };
  }

  /** Persiste token + utilizador (login, primeira troca de senha, etc.). */
  applySessionFromLoginResponse(response: LoginResponse): void {
    this.clearExternalSession();
    this.sessionHydrate$ = undefined;
    this.sessionFreshFromLogin = true;
    localStorage.setItem(this.TOKEN_KEY, response.token);
    const user = this.withNormalizedFoto(response.user);
    this.storeAuthData({ ...response, user });
    this.currentUserSubject.next(user);
    this.tenantFeatureService.syncFromUser(user);
    this.warmPostLoginCaches(response);
  }

  /** Pré-aquece onboarding e menu antes da navegação pós-login (padrão Bellows). */
  private warmPostLoginCaches(response: LoginResponse): void {
    const menuFromLogin = response.user?.menuFuncionalidades;
    try {
      const menu = this.injector.get(MenuService);
      if (menuFromLogin?.length) {
        menu.applyLoginMenu(menuFromLogin);
      } else {
        menu.carregarMenuDinamico().subscribe({ error: () => {} });
      }
    } catch {
      /* noop */
    }
    // Status de onboarding não bloqueia login — adia para não competir com /meu-menu e listas.
    setTimeout(() => {
      try {
        this.injector.get(SistemaEmpresaService).getStatusCached().subscribe({ error: () => {} });
      } catch {
        /* noop */
      }
    }, 3_000);
  }

  /** Atualiza perfil e {@code funcionalidadeCodigos} a partir do backend (mesmo utilizador, mesmo token). */
  refreshCurrentUserFromServer(): Observable<User | null> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.get<User>(`${apiUrl}/auth/me`).pipe(
      tap((u) => {
        const prev = this.getCurrentUser();
        const merged = { ...prev, ...u } as User;
        this.updateCurrentUser(merged);
        this.tenantFeatureService.syncFromUser(merged);
      }),
      map(() => this.getCurrentUser())
    );
  }

  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    });
  }

  private storeAuthData(response: LoginResponse): void {
    localStorage.setItem(this.TOKEN_KEY, response.token);
    localStorage.setItem(this.USER_KEY, JSON.stringify(response.user));
  }

  private loadStoredUser(): void {
    const userStr = localStorage.getItem(this.USER_KEY);
    const token = this.getToken();
    
    if (userStr && token && !this.isTokenExpired(token)) {
      try {
        const user = this.withNormalizedFoto(JSON.parse(userStr));
        this.currentUserSubject.next(user);
        this.tenantFeatureService.syncFromUser(user);
        localStorage.setItem(this.USER_KEY, JSON.stringify(user));
        if (user?.id != null && !shouldSkipSessionHydrateOnStartup()) {
          this.hydrateSessionFromServer().subscribe({ error: () => {} });
        }
      } catch (error) {
        console.error('Failed to load user from localStorage:', error);
        this.clearAuthData();
      }
    } else {
      this.clearAuthData();
    }
  }

  private clearAuthData(): void {
    this.sessionHydrate$ = undefined;
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
    this.currentUserSubject.next(null);
    void import('../core/menu.service').then(({ MenuService }) => {
      try {
        this.injector.get(MenuService).invalidateMenuCache();
      } catch {
        /* noop */
      }
    });
  }

  /** Atualiza utilizador (foto, permissões, etc.) a partir de {@code GET /auth/me} após reload/login. */
  hydrateSessionFromServer(): Observable<User | null> {
    const token = this.getToken();
    if (!token || this.isTokenExpired(token)) {
      return of(null);
    }
    if (this.sessionFreshFromLogin) {
      this.sessionFreshFromLogin = false;
      return of(this.getCurrentUser());
    }
    if (!this.sessionHydrate$) {
      this.sessionHydrate$ = this.refreshCurrentUserFromServer().pipe(
        catchError(() => of(this.getCurrentUser())),
        shareReplay({ bufferSize: 1, refCount: false })
      );
    }
    return this.sessionHydrate$;
  }

  /**
   * Backend (JwtTokenService) emite JWT compacto (header.payload.sig).
   * O código antigo fazia atob(token) no token inteiro — falha com '.' e marcava sempre expirado,
   * o que quebrava o login (AuthGuard redirecionava para /login logo após sucesso).
   */
  private isTokenExpired(token: string): boolean {
    if (!token) {
      return true;
    }
    const segments = token.split('.');
    if (segments.length === 3) {
      try {
        const payloadJson = this.decodeBase64Url(segments[1]);
        const payload = JSON.parse(payloadJson) as { exp?: number };
        if (typeof payload.exp === 'number') {
          return Date.now() >= payload.exp * 1000;
        }
        return false;
      } catch {
        return true;
      }
    }
    // Token legado (não JWT): "..." com timestamp em parte conhecida
    try {
      const tokenData = atob(token);
      const parts = tokenData.split(':');
      if (parts.length >= 3) {
        const tokenTime = parseInt(parts[2], 10);
        if (Number.isNaN(tokenTime)) {
          return true;
        }
        const twentyFourHours = 24 * 60 * 60 * 1000;
        return Date.now() - tokenTime > twentyFourHours;
      }
      return true;
    } catch {
      return true;
    }
  }

  private decodeBase64Url(segment: string): string {
    let b64 = segment.replace(/-/g, '+').replace(/_/g, '/');
    while (b64.length % 4 !== 0) {
      b64 += '=';
    }
    return atob(b64);
  }

  // Métodos para reset de senha
  requestPasswordReset(email: string, tenantCodigo?: string | null): Observable<{ message: string }> {
    // LOG FORÇADO PARA DEBUG - VERSÃO ATUALIZADA
    
    // Usar URL dinâmica para sempre detectar o IP correto baseado na URL atual
    const hasGetApiUrl = typeof environment.getApiUrl === 'function';
    
    const apiUrl = hasGetApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const url = `${apiUrl}/auth/forgot-password`;
    
    const body: { email: string; tenantCodigo?: string } = { email };
    if (tenantCodigo?.trim()) {
      body.tenantCodigo = tenantCodigo.trim();
    }
    return this.http.post<{ message: string }>(url, body);
  }

  validateResetToken(token: string): Observable<{ valid: boolean; email?: string }> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const url = `${apiUrl}/auth/validate-reset-token/${token}`;
    return this.http.get<{ valid: boolean; email?: string }>(url);
  }

  resetPassword(token: string, newPassword: string): Observable<{ message: string }> {
    // Usar URL dinâmica para sempre detectar o IP correto baseado na URL atual
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    const url = `${apiUrl}/auth/reset-password`;
    const body = {
      token,
      newPassword
    };
    
    
    return this.http.post<{ message: string }>(url, body);
  }

  changePasswordForNewUser(email: string, senhaTemporaria: string, novaSenha: string): Observable<LoginResponse> {
    const apiUrl = environment.getApiUrl ? environment.getApiUrl() : environment.apiUrl;
    return this.http.post<LoginResponse>(`${apiUrl}/auth/change-password-new-user`, {
      email,
      senhaTemporaria,
      novaSenha,
    });
  }
}
