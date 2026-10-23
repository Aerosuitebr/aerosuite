import { Injectable, inject } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map, shareReplay, tap } from 'rxjs/operators';
import { AuthService } from '../../auth/auth.service';
import { MenuService } from '../../core/menu.service';


/** Cache de funcionalidades do fluxo de OS do perfil (alinhado ao menu e ao RBAC do backend). */
@Injectable({ providedIn: 'root' })
export class OsFluxoPermissaoService {
  private readonly menu = inject(MenuService);
  private readonly auth = inject(AuthService);
  private codes = new Set<string>();
  private ready = false;
  private load$?: Observable<Set<string>>;
  private cachedPerfilId?: string;

  ensureLoaded(): Observable<Set<string>> {
    const user = this.auth.getCurrentUser();
    const perfilId = user ? [user.tenantId,user.id,user.perfil?.id].join(':') : ''; 
    if (this.ready && this.cachedPerfilId === perfilId) {
      return of(this.codes);
    }
    if (this.cachedPerfilId !== perfilId) {
      this.invalidate();
      this.cachedPerfilId = perfilId;
    }
    if (!this.load$) {
      this.load$ = this.menu.carregarFuncionalidadesUsuario().pipe(
        tap((list) => {
          this.codes = new Set(list.filter((f) => f.ativo).map((f) => f.codigo));
          this.ready = true;
        }),
        map(() => this.codes),
        shareReplay(1),
        catchError(() => {
          this.codes = new Set();
          this.ready = true;
          return of(this.codes);
        })
      );
    }
    return this.load$;
  }

  invalidate(): void {
    this.codes = new Set();
    this.ready = false;
    this.load$ = undefined;
  }

  has(codigo: string): boolean {
    return this.codes.has(codigo);
  }

  hasAny(codigos: readonly string[]): boolean {
    return codigos.some((c) => this.codes.has(c));
  }

  hasModuleAccess(): boolean {
    return [...this.codes].some(c => c.startsWith('OS_FLUXO_'));
  }

  isReady(): boolean {
    return this.ready;
  }
}
