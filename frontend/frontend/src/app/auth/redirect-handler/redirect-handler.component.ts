import { Component, OnInit, inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { UsuarioExternoService } from '../../core/usuario-externo.service';
import { TranslatePipe } from '../../core/translate.pipe';

/**
 * Componente para redirecionamento inteligente.
 * Detecta o tipo de usuário (interno ou externo) e redireciona para a tela correta.
 */
@Component({
  standalone: true,
  imports: [TranslatePipe],
  selector: 'app-redirect-handler',
  template: `
    <div class="redirect-container">
      <div class="loading-spinner">
        <i class="pi pi-spin pi-spinner"></i>
        <p>{{ 'auth.redirect.loading' | translate }}</p>
      </div>
    </div>
  `,
  styles: [`
    .redirect-container {
      display: flex;
      justify-content: center;
      align-items: center;
      height: 100vh;
      background: linear-gradient(135deg, #1e3a5f 0%, #0d1b2a 100%);
    }
    .loading-spinner {
      text-align: center;
      color: white;
    }
    .loading-spinner i {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .loading-spinner p {
      font-size: 1.2rem;
      opacity: 0.8;
    }
  `]
})
export class RedirectHandlerComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  private usuarioExternoService = inject(UsuarioExternoService);

  ngOnInit() {
    this.handleRedirect();
  }

  private handleRedirect() {
    // Verificar se é usuário interno autenticado
    if (this.authService.isAuthenticated()) {
      this.router.navigate(['/'], { replaceUrl: true });
      return;
    }

    // Verificar se é usuário externo autenticado
    if (this.usuarioExternoService.isAuthenticated()) {
      this.router.navigate(['/externo/home'], { replaceUrl: true });
      return;
    }

    // Nenhum usuário autenticado - redirecionar para login
    this.router.navigate(['/login'], { replaceUrl: true });
  }
}
