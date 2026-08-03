import { Injectable, Injector } from '@angular/core';
import {
  HttpInterceptor,
  HttpRequest,
  HttpHandler,
  HttpEvent,
  HttpErrorResponse,
} from '@angular/common/http';
import { SUPPRESS_FORBIDDEN_TOAST } from './http-context-tokens';
import { Observable, throwError } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { MessageService } from 'primeng/api';
import { TranslationService } from '../core/translation.service';
import { AuthService } from './auth.service';
import { UsuarioExternoService } from '../core/usuario-externo.service';
import { PlatformOpsAuthService } from '../platform-ops/platform-ops-auth.service';
import { isPublicApiRequest, isPublicAppRoute, isInternalApiRequest, isPlatformOpsAuthApiRequest } from './public-auth-routes.util';

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(
    private injector: Injector,
    private router: Router,
    private messageService: MessageService,
    private i18n: TranslationService
  ) {}

  /** Lazy — evita NG0200; não cachear: 1.º GET durante construção do AuthService pode fixar instância incompleta. */
  private getAuthService(): AuthService {
    return this.injector.get(AuthService);
  }

  private getUsuarioExternoService(): UsuarioExternoService {
    return this.injector.get(UsuarioExternoService);
  }

  private getPlatformOpsAuth(): PlatformOpsAuthService {
    return this.injector.get(PlatformOpsAuthService);
  }

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const authService = this.getAuthService();
    const usuarioExternoService = this.getUsuarioExternoService();
    const internalActive = authService.isAuthenticated();
    const externalActive = usuarioExternoService.isAuthenticated();

    // Só bloqueia endpoints internos quando a sessão ativa é exclusivamente externa.
    // Sessão interna tem prioridade (evita falso positivo se restou token externo no storage).
    if (externalActive && !internalActive) {
      // Lista de endpoints internos que usuários externos NÃO podem acessar
      const blockedEndpoints = [
        '/api/os',           // Endpoint interno de OS (sem /auth-externo/ ou /usuarios-externos/)
        '/api/os-auditoria',
        '/api/usuarios',     // Endpoint interno de usuários
        '/api/fabricantes',  // Endpoint interno de fabricantes
        '/api/fcu',          // Endpoint interno de FCU
        '/api/produtos',     // Endpoint interno de produtos
        '/api/tipos-servico', // Endpoint interno de tipos de serviço
        '/api/perfis',       // Endpoint interno de perfis
        '/api/funcionalidades', // Endpoint interno de funcionalidades
        '/api/delegacao-funcionalidades'
      ];
      
      // Verificar se está tentando acessar um endpoint bloqueado
      const url = req.url;
      const isBlocked = blockedEndpoints.some(endpoint => 
        url.includes(endpoint) && 
        !url.includes('/auth-externo/') && 
        !url.includes('/usuarios-externos/')
      );
      
      if (isBlocked) {
        console.error('🚫 SECURITY: External user blocked from internal endpoint:', url);
        
        // Redirecionar para home do portal externo
        if (!this.router.url.startsWith('/externo/login')) {
          this.router.navigate(['/externo'], { replaceUrl: false });
        }
        
        // Retornar erro 403 (Forbidden)
        return throwError(() => new HttpErrorResponse({
          error: {
            error: this.i18n.translate('auth.interceptor.toast.forbiddenSummary'),
            message: this.i18n.translate('auth.interceptor.error.externalBlocked')
          },
          status: 403,
          statusText: 'Forbidden',
          url: url
        }));
      }
    }
    
    // Endpoints de autenticação que NÃO devem enviar Bearer (login, reset, etc.)
    const u = req.url;
    const isPublicAuthRequest = isPublicApiRequest(u);
    const isPlatformOpsAuthRequest = isPlatformOpsAuthApiRequest(u);
    const isInternalApi = isInternalApiRequest(u);
    
    const externalToken = usuarioExternoService.getToken();
    const internalToken = authService.getToken();
    const platformOpsAuth = this.getPlatformOpsAuth();
    const opsToken = platformOpsAuth.getToken();
    const isPlatformControlApi = u.includes('/api/platform/');
    const isPlatformOpsMfaEnrollment =
      u.includes('/api/platform-ops/mfa/setup') || u.includes('/api/platform-ops/mfa/confirm');
    const isPlatformOpsElevatedApi = u.includes('/api/platform-ops/revalidate-mfa');
    const isPlatformTenantApi = u.includes('/api/tenants');

    // Cadastro MFA inline: preserva Bearer mfa_setup enviado pelo componente (não trocar por JWT da app).
    if (isPlatformOpsMfaEnrollment && req.headers.has('Authorization')) {
      return next.handle(req);
    }

    const useExternalBearer =
        isInternalApi &&
        !isPublicAuthRequest &&
        usuarioExternoService.isAuthenticated() &&
        !!externalToken &&
        u.includes('/api/auth-externo/me');

    const useInternalBearer =
        isInternalApi &&
        !isPublicAuthRequest &&
        !useExternalBearer &&
        !isPlatformControlApi &&
        !isPlatformOpsElevatedApi &&
        !!internalToken &&
        authService.isAuthenticated();

    const usePlatformOpsBearer =
        isInternalApi &&
        !isPublicAuthRequest &&
        !!opsToken &&
        (isPlatformControlApi || isPlatformTenantApi || isPlatformOpsElevatedApi);

    if (useExternalBearer || useInternalBearer || usePlatformOpsBearer) {
      const token = usePlatformOpsBearer
        ? opsToken
        : useExternalBearer
          ? externalToken
          : internalToken;
      const isFormData = req.body instanceof FormData;
      const headers: { [key: string]: string } = {
        Authorization: `Bearer ${token}`
      };

      if (useInternalBearer) {
        const user = authService.getCurrentUser();
        if (user) {
          headers['X-User-Id'] = String(user.id);
          headers['X-User-Name'] = user.nome || user.email || 'Usuario';
          if (user.email) {
            headers['X-User-Email'] = user.email;
          }
        }
      }

      if (!isFormData) {
        const hasContentType = req.headers.has('Content-Type');
        if (!hasContentType) {
          headers['Content-Type'] = 'application/json';
        }
      }

      req = req.clone({ setHeaders: headers });
    } else if (isPublicAuthRequest && req.body && !(req.body instanceof FormData) && !req.headers.has('Content-Type')) {
      // Para requisições de auth, garantir que Content-Type está definido
      req = req.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    } else if (isInternalApi && !isPublicAuthRequest && req.body && !(req.body instanceof FormData) && !req.headers.has('Content-Type')) {
      // Se não for auth request e não tiver Content-Type, adicionar
      req = req.clone({
        setHeaders: {
          'Content-Type': 'application/json'
        }
      });
    }

    return next.handle(req).pipe(
      catchError((error: HttpErrorResponse) => {
        // Não redirecionar para login se for uma requisição de autenticação (login, forgot-password, etc)
        // O 401 durante o login é esperado quando as credenciais estão incorretas
        if (error.status === 401 && !isPublicAuthRequest && !isPlatformOpsAuthRequest) {
          const onExternoRoute = this.router.url.startsWith('/externo');
          authService.clearSessionSilently();
          if (!isPublicAppRoute(this.router.url)) {
            if (onExternoRoute) {
              usuarioExternoService.logout();
              this.router.navigate(['/externo/login']);
            } else {
              this.router.navigate(['/login']);
            }
          }
        }

        if (error.status === 403 && !isPublicAuthRequest) {
          const errBody = error.error as { code?: string } | null;
          if (
            (isPlatformControlApi || isPlatformTenantApi || isPlatformOpsElevatedApi) &&
            errBody?.code === 'PLATFORM_OPS_MFA_STALE'
          ) {
            this.getPlatformOpsAuth().notifyMfaStale();
            return throwError(() => error);
          }
          if (req.context.get(SUPPRESS_FORBIDDEN_TOAST)) {
            return throwError(() => error);
          }
          let detail = this.i18n.translate('auth.interceptor.toast.forbiddenDefaultDetail');
          const body = error.error as Record<string, unknown> | string | null | undefined;
          if (body && typeof body === 'object' && !Array.isArray(body) && typeof body['message'] === 'string') {
            detail = body['message'] as string;
          } else if (typeof body === 'string') {
            try {
              const parsed = JSON.parse(body) as { message?: string };
              if (parsed?.message) {
                detail = parsed.message;
              }
            } catch {
              /* ignore */
            }
          }
          this.i18n.addToastLiteralDetail(
            this.messageService,
            'warn',
            'auth.interceptor.toast.forbiddenSummary',
            detail
          );
        }
        
        // Se o erro for uma resposta HTML (erro de parsing JSON)
        if (error.error && typeof error.error === 'string' && error.error.includes('<!DOCTYPE')) {
          console.error('Interceptor: Backend retornou HTML em vez de JSON');
          console.error('URL:', req.url);
          console.error('Method:', req.method);
          console.error('Status:', error.status);
          console.error('Resposta (primeiros 500 chars):', error.error.substring(0, 500));
          
          // Retornar um erro estruturado
          return throwError(() => ({
            status: error.status || 500,
            statusText: error.statusText || 'Server Error',
            error: {
              error: this.i18n.translate('auth.interceptor.error.serverHtml'),
              message: this.i18n.translate('auth.interceptor.error.serverInvalidResponse')
            },
            message: this.i18n.translate('auth.interceptor.error.serverGeneric')
          }));
        }
        
        return throwError(() => error);
      })
    );
  }
}
