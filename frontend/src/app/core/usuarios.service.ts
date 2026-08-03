import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpContext, HttpParams, HttpErrorResponse } from '@angular/common/http';
import { SUPPRESS_FORBIDDEN_TOAST } from '../auth/http-context-tokens';
import { catchError, throwError, map } from 'rxjs';
import { environment } from '../../environments/environment';
import { TranslationService } from './translation.service';

export interface Page<T> { items: T[]; totalElements: number; totalPages: number; page: number; size: number; sort?: string; }

export interface Usuario { id?: number; [key: string]: any; }

@Injectable({ providedIn: 'root' })
export class UsuarioService {
  private http = inject(HttpClient);
  private i18n = inject(TranslationService);
  private base = `${environment.apiUrl}/usuarios`;
  list(params: any = {}, opts?: { suppressForbiddenToast?: boolean }) {
    let hp = new HttpParams();
    // Filtrar apenas registros ativos por padrão (backend usa 'ativo' ao invés de 'isActive')
    hp = hp.set('ativo', 'true');
    for (const [k,v] of Object.entries(params)) if (v !== undefined && v !== null && v !== '') hp = hp.set(k, String(v));
    const context = opts?.suppressForbiddenToast ? new HttpContext().set(SUPPRESS_FORBIDDEN_TOAST, true) : undefined;
    return this.http.get<Page<Usuario>>(this.base, context ? { params: hp, context } : { params: hp });
  }
  getById(id: number) { return this.http.get<Usuario>(`${this.base}/${id}`); }
  update(id: number, body: any) { return this.http.put<Usuario>(`${this.base}/${id}`, body); }
  delete(id: number) { 
    return this.http.delete<Usuario>(`${this.base}/${id}`).pipe(
      map((response: any) => {
        // Retornar objeto de sucesso compatível com o código existente
        return { success: true };
      }),
      catchError((error: HttpErrorResponse) => {
        console.error('UsuarioService.delete - error:', error);
        if (error.error && typeof error.error === 'string' && error.error.includes('<!DOCTYPE')) {
          console.error('Backend retornou HTML em vez de JSON:', error.error.substring(0, 200));
          return throwError(() => ({
            status: error.status || 500,
            error: { error: this.i18n.translate('usuario.service.error.serverInvalid') },
            message: this.i18n.translate('auth.interceptor.error.serverGeneric')
          }));
        }
        if (error.status === 404) {
          return throwError(() => ({
            status: 404,
            error: { error: this.i18n.translate('usuario.service.error.notFound') },
            message: this.i18n.translate('usuario.service.error.notFound')
          }));
        }
        return throwError(() => error);
      })
    );
  }
  create(body: any) { return this.http.post<Usuario>(this.base, body); }
  associarPerfil(usuarioId: number, perfilId: number) {
    return this.http.put<Usuario>(`${this.base}/${usuarioId}/perfil/${perfilId}`, {});
  }
  solicitarResetSenha(id: number) {
    return this.http.post<{ message: string }>(`${this.base}/${id}/solicitar-reset-senha`, {});
  }
}
