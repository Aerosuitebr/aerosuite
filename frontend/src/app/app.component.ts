import { Component, OnInit, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ToastModule } from 'primeng/toast';
import { ThemeService } from './shared/themes/theme.service';
import { AppearancePreferencesService } from './core/appearance-preferences.service';
import { TranslationService } from './core/translation.service';
import { HangarOfflineSyncService } from './core/hangar-offline-sync.service';
import { HangarPwaService } from './core/hangar-pwa.service';
import { PrimeNgI18nService } from './core/prime-ng-i18n.service';
import { BrandingService } from './core/branding.service';
import { shouldSkipSessionHydrateOnStartup } from './auth/public-auth-routes.util';
import { DeploymentBannerComponent } from './shared/deployment-banner/deployment-banner.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, CommonModule, ToastModule, DeploymentBannerComponent],
  template: `
    <app-deployment-banner></app-deployment-banner>
    <p-toast position="top-right"></p-toast>
    <!-- Área principal do app -->
    <router-outlet></router-outlet>
  `
})
export class AppComponent implements OnInit {
  private theme = inject(ThemeService);
  private appearanceService = inject(AppearancePreferencesService);
  private translationService = inject(TranslationService);
  private hangarOfflineSync = inject(HangarOfflineSyncService);
  private hangarPwa = inject(HangarPwaService);
  private primeNgI18n = inject(PrimeNgI18nService);
  private branding = inject(BrandingService);

  ngOnInit() {
    this.hangarPwa.registerIfSupported();
    // Branding em background — não bloqueia bootstrap (padrão Bellows).
    void this.branding.load({ allowSessionTenant: !shouldSkipSessionHydrateOnStartup() });
    try {
      this.appearanceService.getPreferences();
      this.translationService.getCurrentLanguage();
      this.primeNgI18n.sync();
      this.translationService.getCurrentLanguage$().subscribe(() => this.primeNgI18n.sync());
      
      // NOTA: A verificação de autenticação é feita pelo AuthGuard nas rotas protegidas
      // Não precisamos verificar aqui para evitar redirecionamentos prematuros
      // que podem interferir com rotas públicas como /reset-password
    } catch (error) {
      console.error('Failed to initialize AppComponent:', error);
    }
  }
}
