import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { AuthService } from './auth.service';
import { UsuarioExternoService } from '../core/usuario-externo.service';

@Injectable({
  providedIn: 'root'
})
export class AuthGuard implements CanActivate {
  
  constructor(
    private authService: AuthService,
    private usuarioExternoService: UsuarioExternoService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    // Verificação robusta de autenticação para usuário interno
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (isAuthenticated) {
      return true;
    }
    
    // ⚠️ IMPORTANTE: Verificar se é um usuário externo tentando acessar rota interna
    // Se sim, redirecionar para o home do portal externo
    const isExternoAuthenticated = this.usuarioExternoService.isAuthenticated();
    if (isExternoAuthenticated) {
      this.router.navigate(['/externo/home'], { replaceUrl: true });
      return false;
    }
    
    // Nenhum usuário autenticado - limpar dados e redirecionar para login
    this.authService.logout();
    
    // Redirecionar para login com a URL de retorno
    this.router.navigate(['/login'], { 
      queryParams: { returnUrl: state.url },
      replaceUrl: true // Substituir a URL atual no histórico
    });
    return false;
  }
}
