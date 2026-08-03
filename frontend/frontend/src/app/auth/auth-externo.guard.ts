import { Injectable } from '@angular/core';
import { CanActivate, Router, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { UsuarioExternoService } from '../core/usuario-externo.service';

@Injectable({
  providedIn: 'root'
})
export class AuthExternoGuard implements CanActivate {
  
  constructor(
    private usuarioExternoService: UsuarioExternoService,
    private router: Router
  ) {}

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): boolean {
    const isAuthenticated = this.usuarioExternoService.isAuthenticated();
    
    // ⚠️ SEGURANÇA: Bloquear acesso de usuários externos a rotas internas
    const url = state.url;
    const internalRoutePrefixes = ['/usuarios', '/fabricantes', '/fcu', '/products', '/tipos-servico', '/tpfiles', '/associacao-fcu', '/controle-acesso', '/funcionalidades', '/perfis', '/usuarios-externos'];
    
    // Verificar se está tentando acessar rota interna (não começa com /externo/)
    if (!url.startsWith('/externo') && !url.startsWith('/login') && !url.startsWith('/forgot-password') && !url.startsWith('/reset-password')) {
      // Verificar se é uma rota interna
      if (internalRoutePrefixes.some(prefix => url.startsWith(prefix)) || url === '/os' || url.startsWith('/os/')) {
        console.error('Access denied: external user attempted internal route:', url);
        this.router.navigate(['/externo'], { replaceUrl: true });
        return false;
      }
    }
    
    if (isAuthenticated) {
      // Verificar se usuário precisa trocar senha
      const user = this.usuarioExternoService.getCurrentUser();
      if (user?.precisaTrocarSenha && !state.url.includes('setup-password')) {
        this.router.navigate(['/externo/setup-password']);
        return false;
      }
      
      // Verificar permissão para a rota específica
      const requiredPermission = route.data?.['permission'];
      if (requiredPermission && !this.usuarioExternoService.hasAccessTo(requiredPermission)) {
        this.router.navigate(['/externo']);
        return false;
      }
      
      return true;
    } else {
      this.usuarioExternoService.logout();
      this.router.navigate(['/externo/login'], { 
        queryParams: { returnUrl: state.url },
        replaceUrl: true
      });
      return false;
    }
  }
}
