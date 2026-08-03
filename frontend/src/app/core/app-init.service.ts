import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth/auth.service';

@Injectable({
  providedIn: 'root'
})
export class AppInitService {

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  /**
   * Inicializa a aplicação com verificações de segurança
   * NOTA: A verificação de autenticação é feita pelo AuthGuard nas rotas protegidas
   * e pelo AppComponent após a navegação ser concluída
   */
  init(): Promise<void> {
    return new Promise((resolve) => {
      // Não verificar autenticação aqui - deixar o AuthGuard e AppComponent fazerem isso
      // Isso evita redirecionamentos prematuros que podem interferir com rotas públicas
      resolve();
    });
  }

  /**
   * Verifica se o usuário tem permissão para acessar uma rota
   */
  canAccessRoute(route: string): boolean {
    return this.authService.isAuthenticated();
  }
}
